package com.rct.repository;

import com.rct.entity.LoginInfo;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginInfoRepository extends JpaRepository<LoginInfo, UUID> {

  Optional<LoginInfo> findByLoginId(String loginId);

  boolean existsByLoginId(String loginId);
}
