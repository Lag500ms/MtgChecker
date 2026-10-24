package com.mtgchecker.accounts.enums;

import java.util.List;

public final class AppPermissions {

    private AppPermissions() {}

    public static final String CARDS_VIEW = "CARDS_VIEW";
    public static final String INVENTORY_VIEW = "INVENTORY_VIEW";
    public static final String INVENTORY_MANAGE = "INVENTORY_MANAGE";
    public static final String ROLE_MANAGE = "ROLE_MANAGE";
    public static final String ACCOUNT_MANAGE = "ACCOUNT_MANAGE";

    public static final List<String> ALL_PERMISSIONS = List.of(
            CARDS_VIEW,
            INVENTORY_VIEW,
            INVENTORY_MANAGE,
            ROLE_MANAGE,
            ACCOUNT_MANAGE
    );

    public static final List<String> DEFAULT_USER_PERMISSIONS = List.of(
            CARDS_VIEW,
            INVENTORY_VIEW,
            INVENTORY_MANAGE
    );
}
