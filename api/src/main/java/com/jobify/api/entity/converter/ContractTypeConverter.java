package com.jobify.api.entity.converter;

import com.jobify.api.entity.ContractType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ContractTypeConverter implements AttributeConverter<ContractType, String> {

    @Override
    public String convertToDatabaseColumn(ContractType attribute) {
        return attribute == null ? null : attribute.value;
    }

    @Override
    public ContractType convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        for (ContractType t : ContractType.values()) {
            if (t.value.equals(dbData)) return t;
        }
        throw new IllegalArgumentException("Unknown contract_type: " + dbData);
    }
}
