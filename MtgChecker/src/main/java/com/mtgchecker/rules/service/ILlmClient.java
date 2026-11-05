package com.mtgchecker.rules.service;

public interface ILlmClient {

    String generateContent(String systemPrompt, String userPrompt);

    String getProviderName();
}
