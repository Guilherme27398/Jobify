package com.jobify.api.entity.converter;

import com.jobify.api.entity.SkillType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class SkillTypeConverter implements AttributeConverter<SkillType, String> {

    @Override
    public String convertToDatabaseColumn(SkillType attribute) {
        return attribute == null ? null : attribute.value;
    }

    @Override
    public SkillType convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        for (SkillType t : SkillType.values()) {
            if (t.value.equals(dbData)) return t;
        }
        throw new IllegalArgumentException("Unknown skill_type: " + dbData);
    }
}
