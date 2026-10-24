package com.mtgchecker.cards.service;

import com.mtgchecker.cards.dto.response.SetResponse;

import java.util.List;

public interface ISetService {

    List<SetResponse> findAll();

    SetResponse findByCode(String code);

    SetResponse findById(String id);

    SetResponse findByTcgplayerId(int id);
}
