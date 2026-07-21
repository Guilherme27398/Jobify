package com.jobify.api.entity.converter;

import com.jobify.api.entity.RemoteType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class RemoteTypeConverter implements AttributeConverter<RemoteType, String> {

    @Override
    public String convertToDatabaseColumn(RemoteType attribute) {
        return attribute == null ? null : attribute.value;
    }

    @Override
    public RemoteType convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        for (RemoteType t : RemoteType.values()) {
            if (t.value.equals(dbData)) return t;
        }
        throw new IllegalArgumentException("Unknown remote_type: " + dbData);
    }
}
