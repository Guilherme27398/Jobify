package com.jobify.api.entity;

public enum RemoteType {
    ON_SITE("on_site"),
    HYBRID("hybrid"),
    REMOTE("remote");

    public final String value;

    RemoteType(String value) { this.value = value; }
}
