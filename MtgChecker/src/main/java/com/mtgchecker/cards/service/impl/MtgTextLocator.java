package com.mtgchecker.cards.service.impl;

import com.mtgchecker.cards.dto.response.ScanCardBounds;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MtgTextLocator {

    private static final int WORK_WIDTH = 1000;
    private static final int MIN_CONTRAST = 40;
    private static final int MAX_BACKGROUND = 90;
    private static final double TARGET_TEXT_HEIGHT = 48.0;
    private static final double CROP_MARGIN = 0.5;
    private static final double THRESHOLD_BIAS = 0.3;

    public record Component(int x0, int y0, int x1, int y1, int w, int h, int count) {}

    public record Line(List<Component> chars, int x0, int y0, int x1, int y1, int w, int h, double charHeight) {}

    public record Block(List<Line> lines, int x0, int y0, int x1, int y1, int w, int h, double charHeight, int charCount, double score) {}

    public record LocatedCandidate(
            double score,
            int lineCount,
            int charCount,
            ScanCardBounds bounds,
            double charHeight
    ) {}

    public static List<LocatedCandidate> locateCollectorTextBlocks(BufferedImage source, int maxCandidates) {
        if (source == null) return List.of();

        double scale = Math.min(1.0, (double) WORK_WIDTH / source.getWidth());
        int width = Math.max(1, (int) Math.round(source.getWidth() * scale));
        int height = Math.max(1, (int) Math.round(source.getHeight() * scale));

        BufferedImage work = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = work.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(source, 0, 0, width, height, null);
        g.dispose();

        float[] gray = toGray(work, width, height);
        int radius = Math.max(6, (int) Math.round((double) width / 80.0));
        byte[] mask = lightOnDarkMask(gray, width, height, radius);

        List<Component> allComps = connectedComponents(mask, width, height);
        List<Component> chars = new ArrayList<>();
        for (Component c : allComps) {
            if (isCharacterLike(c, height)) {
                chars.add(c);
            }
        }

        List<Line> lines = groupIntoLines(chars);
        List<Block> blocks = groupIntoBlocks(lines);

        List<Block> scored = new ArrayList<>();
        for (Block b : blocks) {
            if (b.charCount() >= 4) {
                double sc = scoreBlock(b, height);
                scored.add(new Block(b.lines(), b.x0(), b.y0(), b.x1(), b.y1(), b.w(), b.h(), b.charHeight(), b.charCount(), sc));
            }
        }

        scored.sort(Comparator.comparingDouble(Block::score).reversed());

        int limit = Math.min(maxCandidates, scored.size());
        List<LocatedCandidate> result = new ArrayList<>();
        for (int i = 0; i < limit; i++) {
            Block b = scored.get(i);
            int origX = Math.max(0, (int) Math.round(b.x0() / scale));
            int origY = Math.max(0, (int) Math.round(b.y0() / scale));
            int origW = Math.min(source.getWidth() - origX, (int) Math.round(b.w() / scale));
            int origH = Math.min(source.getHeight() - origY, (int) Math.round(b.h() / scale));

            result.add(new LocatedCandidate(
                    b.score(),
                    b.lines().size(),
                    b.charCount(),
                    new ScanCardBounds(origX, origY, origW, origH),
                    b.charHeight() / scale
            ));
        }

        return result;
    }

    public static BufferedImage extractAndBinarize(BufferedImage source, LocatedCandidate candidate) {
        ScanCardBounds b = candidate.bounds();
        double ch = candidate.charHeight();
        double margin = ch * CROP_MARGIN;

        int x0 = Math.max(0, (int) Math.floor(b.x() - margin));
        int y0 = Math.max(0, (int) Math.floor(b.y() - margin));
        int x1 = Math.min(source.getWidth(), (int) Math.ceil(b.x() + b.width() + margin));
        int y1 = Math.min(source.getHeight(), (int) Math.ceil(b.y() + b.height() + margin));

        int cropW = Math.max(1, x1 - x0);
        int cropH = Math.max(1, y1 - y0);

        double factor = Math.min(6.0, Math.max(0.5, TARGET_TEXT_HEIGHT / Math.max(1.0, ch)));
        int outW = Math.max(1, (int) Math.round(cropW * factor));
        int outH = Math.max(1, (int) Math.round(cropH * factor));

        BufferedImage scaled = new BufferedImage(outW, outH, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = scaled.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.drawImage(source, 0, 0, outW, outH, x0, y0, x1, y1, null);
        g.dispose();

        float[] gray = toGray(scaled, outW, outH);
        int otsu = otsuThreshold(gray);

        double lightSum = 0;
        int lightCount = 0;
        for (float v : gray) {
            if (v > otsu) {
                lightSum += v;
                lightCount++;
            }
        }
        double lightMean = lightCount > 0 ? (lightSum / lightCount) : otsu;
        int threshold = (int) Math.round(otsu + THRESHOLD_BIAS * (lightMean - otsu));

        int pad = (int) Math.round(TARGET_TEXT_HEIGHT * 0.4);
        int paddedW = outW + 2 * pad;
        int paddedH = outH + 2 * pad;

        BufferedImage binary = new BufferedImage(paddedW, paddedH, BufferedImage.TYPE_BYTE_BINARY);
        Graphics2D bg = binary.createGraphics();
        bg.setColor(Color.WHITE);
        bg.fillRect(0, 0, paddedW, paddedH);
        bg.dispose();

        for (int y = 0; y < outH; y++) {
            for (int x = 0; x < outW; x++) {
                float val = gray[y * outW + x];
                int rgb = (val > threshold) ? 0x000000 : 0xFFFFFF;
                binary.setRGB(x + pad, y + pad, rgb);
            }
        }

        return binary;
    }

    private static float[] toGray(BufferedImage img, int w, int h) {
        float[] gray = new float[w * h];
        int[] rgb = new int[w * h];
        img.getRGB(0, 0, w, h, rgb, 0, w);
        for (int i = 0; i < rgb.length; i++) {
            int p = rgb[i];
            int r = (p >> 16) & 0xFF;
            int g = (p >> 8) & 0xFF;
            int b = p & 0xFF;
            gray[i] = (float) (0.299 * r + 0.587 * g + 0.114 * b);
        }
        return gray;
    }

    private static double[] integralImage(float[] gray, int w, int h) {
        int stride = w + 1;
        double[] integral = new double[stride * (h + 1)];
        for (int y = 0; y < h; y++) {
            double rowSum = 0;
            for (int x = 0; x < w; x++) {
                rowSum += gray[y * w + x];
                integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + rowSum;
            }
        }
        return integral;
    }

    private static byte[] lightOnDarkMask(float[] gray, int w, int h, int radius) {
        double[] integral = integralImage(gray, w, h);
        int stride = w + 1;
        byte[] mask = new byte[w * h];
        for (int y = 0; y < h; y++) {
            int y0 = Math.max(0, y - radius);
            int y1 = Math.min(h, y + radius + 1);
            for (int x = 0; x < w; x++) {
                int x0 = Math.max(0, x - radius);
                int x1 = Math.min(w, x + radius + 1);
                double sum = integral[y1 * stride + x1] - integral[y0 * stride + x1] - integral[y1 * stride + x0] + integral[y0 * stride + x0];
                double mean = sum / ((x1 - x0) * (y1 - y0));
                int k = y * w + x;
                if (mean <= MAX_BACKGROUND && (gray[k] - mean) >= MIN_CONTRAST) {
                    mask[k] = 1;
                }
            }
        }
        return mask;
    }

    private static List<Component> connectedComponents(byte[] mask, int w, int h) {
        int[] labels = new int[w * h];
        List<Component> list = new ArrayList<>();
        int[] stack = new int[w * h];

        for (int start = 0; start < mask.length; start++) {
            if (mask[start] == 0 || labels[start] != 0) continue;
            int id = list.size() + 1;
            labels[start] = id;
            int minX = w, minY = h, maxX = -1, maxY = -1, count = 0;
            int stackPtr = 0;
            stack[stackPtr++] = start;

            while (stackPtr > 0) {
                int k = stack[--stackPtr];
                int x = k % w;
                int y = k / w;
                count++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;

                for (int dy = -1; dy <= 1; dy++) {
                    int ny = y + dy;
                    if (ny < 0 || ny >= h) continue;
                    for (int dx = -1; dx <= 1; dx++) {
                        int nx = x + dx;
                        if (nx < 0 || nx >= w) continue;
                        int n = ny * w + nx;
                        if (mask[n] != 0 && labels[n] == 0) {
                            labels[n] = id;
                            stack[stackPtr++] = n;
                        }
                    }
                }
            }
            list.add(new Component(minX, minY, maxX, maxY, maxX - minX + 1, maxY - minY + 1, count));
        }
        return list;
    }

    private static boolean isCharacterLike(Component c, int imageHeight) {
        if (c.h < 4 || c.h > imageHeight * 0.03) return false;
        if (c.w > c.h * 4) return false;
        return c.count >= 4;
    }

    private static class UnionFind {
        private final int[] parent;

        public UnionFind(int n) {
            parent = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }

        public int find(int i) {
            while (parent[i] != i) {
                parent[i] = parent[parent[i]];
                i = parent[i];
            }
            return i;
        }

        public void union(int a, int b) {
            parent[find(a)] = find(b);
        }
    }

    private static List<Line> groupIntoLines(List<Component> chars) {
        List<Component> sorted = new ArrayList<>(chars);
        sorted.sort(Comparator.comparingInt(Component::x0));

        UnionFind uf = new UnionFind(sorted.size());
        for (int i = 0; i < sorted.size(); i++) {
            Component a = sorted.get(i);
            for (int j = i + 1; j < sorted.size(); j++) {
                Component b = sorted.get(j);
                int maxH = Math.max(a.h, b.h);
                if (b.x0 - a.x1 > maxH * 2.5) break;
                if (Math.max(a.h, b.h) > Math.min(a.h, b.h) * 2.2) continue;
                double centerA = (a.y0 + a.y1) / 2.0;
                double centerB = (b.y0 + b.y1) / 2.0;
                if (Math.abs(centerA - centerB) > maxH * 0.5) continue;
                uf.union(i, j);
            }
        }

        Map<Integer, List<Component>> groups = new HashMap<>();
        for (int i = 0; i < sorted.size(); i++) {
            groups.computeIfAbsent(uf.find(i), k -> new ArrayList<>()).add(sorted.get(i));
        }

        List<Line> lines = new ArrayList<>();
        for (List<Component> group : groups.values()) {
            if (group.size() < 2) continue;
            int x0 = Integer.MAX_VALUE, y0 = Integer.MAX_VALUE, x1 = -1, y1 = -1;
            int[] heights = new int[group.size()];
            for (int i = 0; i < group.size(); i++) {
                Component c = group.get(i);
                x0 = Math.min(x0, c.x0);
                y0 = Math.min(y0, c.y0);
                x1 = Math.max(x1, c.x1);
                y1 = Math.max(y1, c.y1);
                heights[i] = c.h;
            }
            Arrays.sort(heights);
            double medianH = heights[heights.length / 2];
            lines.add(new Line(group, x0, y0, x1, y1, x1 - x0 + 1, y1 - y0 + 1, medianH));
        }
        return lines;
    }

    private static List<Block> groupIntoBlocks(List<Line> lines) {
        UnionFind uf = new UnionFind(lines.size());
        for (int i = 0; i < lines.size(); i++) {
            for (int j = i + 1; j < lines.size(); j++) {
                Line a = lines.get(i);
                Line b = lines.get(j);
                double charHeight = Math.max(a.charHeight, b.charHeight);
                if (Math.max(a.charHeight, b.charHeight) > Math.min(a.charHeight, b.charHeight) * 1.6) continue;
                int verticalGap = Math.max(a.y0, b.y0) - Math.min(a.y1, b.y1);
                if (verticalGap > charHeight * 1.2) continue;
                if (Math.abs(a.x0 - b.x0) > charHeight * 2) continue;
                uf.union(i, j);
            }
        }

        Map<Integer, List<Line>> groups = new HashMap<>();
        for (int i = 0; i < lines.size(); i++) {
            groups.computeIfAbsent(uf.find(i), k -> new ArrayList<>()).add(lines.get(i));
        }

        List<Block> blocks = new ArrayList<>();
        for (List<Line> group : groups.values()) {
            group.sort(Comparator.comparingInt(Line::y0));
            int x0 = Integer.MAX_VALUE, y0 = Integer.MAX_VALUE, x1 = -1, y1 = -1;
            int charCount = 0;
            List<Integer> allHeights = new ArrayList<>();
            for (Line l : group) {
                x0 = Math.min(x0, l.x0);
                y0 = Math.min(y0, l.y0);
                x1 = Math.max(x1, l.x1);
                y1 = Math.max(y1, l.y1);
                charCount += l.chars.size();
                for (Component c : l.chars) {
                    allHeights.add(c.h);
                }
            }
            allHeights.sort(Integer::compareTo);
            double medianH = allHeights.isEmpty() ? 0 : allHeights.get(allHeights.size() / 2);
            blocks.add(new Block(group, x0, y0, x1, y1, x1 - x0 + 1, y1 - y0 + 1, medianH, charCount, 0));
        }
        return blocks;
    }

    private static double scoreBlock(Block b, int imageHeight) {
        double score = Math.min(b.charCount, 30);
        int lineCount = b.lines.size();
        if (lineCount == 2) {
            score += 20;
        } else if (lineCount > 3) {
            score -= 10 * (lineCount - 3);
        }

        List<Integer> heights = new ArrayList<>();
        for (Line l : b.lines) {
            for (Component c : l.chars) {
                heights.add(c.h);
            }
        }

        if (!heights.isEmpty()) {
            long spreadCount = heights.stream()
                    .filter(h -> Math.abs(h - b.charHeight) <= b.charHeight * 0.35)
                    .count();
            double spread = (double) spreadCount / heights.size();
            score *= spread;
        }

        score += 5.0 * ((double) b.y1 / Math.max(1, imageHeight));
        return score;
    }

    public static int otsuThreshold(float[] grayValues) {
        if (grayValues.length == 0) return 128;
        int[] histogram = new int[256];
        for (float v : grayValues) {
            int idx = Math.max(0, Math.min(255, Math.round(v)));
            histogram[idx]++;
        }

        int total = grayValues.length;
        double sum = 0;
        for (int t = 0; t < 256; t++) sum += t * histogram[t];

        double sumBackground = 0;
        int weightBackground = 0;
        double maxVariance = 0;
        int threshold = 128;

        for (int t = 0; t < 256; t++) {
            weightBackground += histogram[t];
            if (weightBackground == 0) continue;
            int weightForeground = total - weightBackground;
            if (weightForeground == 0) break;

            sumBackground += t * histogram[t];
            double meanBackground = sumBackground / weightBackground;
            double meanForeground = (sum - sumBackground) / weightForeground;
            double variance = (double) weightBackground * weightForeground * Math.pow(meanBackground - meanForeground, 2);
            if (variance > maxVariance) {
                maxVariance = variance;
                threshold = t;
            }
        }
        return threshold;
    }
}
