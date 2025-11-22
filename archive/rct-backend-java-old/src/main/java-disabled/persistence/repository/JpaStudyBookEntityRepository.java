package com.rct.infrastructure.persistence.repository;

import com.rct.infrastructure.persistence.entity.StudyBookEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * JPA repository interface for StudyBookEntity. This provides the basic CRUD operations and custom
 * queries for study book persistence.
 */
@Repository
public interface JpaStudyBookEntityRepository extends JpaRepository<StudyBookEntity, UUID> {

  /**
   * Finds all study book entities belonging to a specific user.
   *
   * @param userId the ID of the user
   * @return list of study book entities owned by the user
   */
  List<StudyBookEntity> findByUserId(UUID userId);

  /**
   * Finds study book entities by user ID and language.
   *
   * @param userId the ID of the user
   * @param language the programming language
   * @return list of study book entities matching the criteria
   */
  List<StudyBookEntity> findByUserIdAndLanguage(UUID userId, String language);

  /**
   * Finds random study book entities for a specific language.
   *
   * @param language the programming language
   * @param limit the maximum number of entities to return
   * @return list of random study book entities
   */
  @Query(
      value =
          "SELECT * FROM study_books WHERE "
              + "(:language IS NULL OR language = :language) "
              + "ORDER BY RANDOM() LIMIT :limit",
      nativeQuery = true)
  List<StudyBookEntity> findRandomByLanguage(
      @Param("language") String language, @Param("limit") int limit);

  /**
   * Finds system problem entities by language.
   *
   * @param language the programming language
   * @return list of system study book entities
   */
  List<StudyBookEntity> findByIsSystemProblemTrueAndLanguage(String language);

  /**
   * Finds all system problem entities.
   *
   * @return list of all system study book entities
   */
  List<StudyBookEntity> findByIsSystemProblemTrue();

  /**
   * Gets all distinct languages available in the system.
   *
   * @return list of available programming languages
   */
  @Query("SELECT DISTINCT s.language FROM StudyBookEntity s ORDER BY s.language")
  List<String> findDistinctLanguages();

  /**
   * Gets all distinct languages for system problems.
   *
   * @return list of languages that have system problems
   */
  @Query(
      "SELECT DISTINCT s.language FROM StudyBookEntity s WHERE s.isSystemProblem = true ORDER BY s.language")
  List<String> findDistinctSystemProblemLanguages();

  /**
   * Gets all distinct languages for a specific user's study books.
   *
   * @param userId the user ID
   * @return list of languages the user has study books for
   */
  @Query(
      "SELECT DISTINCT s.language FROM StudyBookEntity s WHERE s.userId = :userId ORDER BY s.language")
  List<String> findDistinctLanguagesByUserId(@Param("userId") UUID userId);
}
