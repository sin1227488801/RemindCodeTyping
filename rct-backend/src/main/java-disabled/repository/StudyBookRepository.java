package com.rct.repository;

import com.rct.entity.StudyBook;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StudyBookRepository extends JpaRepository<StudyBook, UUID> {

  Page<StudyBook> findByUserIdAndLanguageContainingIgnoreCaseAndQuestionContainingIgnoreCase(
      UUID userId, String language, String query, Pageable pageable);

  Page<StudyBook> findByUserIdAndLanguageContainingIgnoreCase(
      UUID userId, String language, Pageable pageable);

  Page<StudyBook> findByUserIdAndQuestionContainingIgnoreCase(
      UUID userId, String query, Pageable pageable);

  Page<StudyBook> findByUserId(UUID userId, Pageable pageable);

  @Query(
      value =
          "SELECT * FROM study_book WHERE user_id = :userId "
              + "AND (:language IS NULL OR language ILIKE %:language%) "
              + "ORDER BY RANDOM() LIMIT :limit",
      nativeQuery = true)
  List<StudyBook> findRandomByUserIdAndLanguage(
      @Param("userId") UUID userId, @Param("language") String language, @Param("limit") int limit);

  // システム問題用メソッド
  long countByIsSystemProblem(Boolean isSystemProblem);

  @Query(
      value =
          "SELECT * FROM study_book WHERE is_system_problem = true "
              + "AND (:language IS NULL OR language ILIKE %:language%) "
              + "ORDER BY RANDOM() LIMIT :limit",
      nativeQuery = true)
  List<StudyBook> findRandomSystemProblemsByLanguage(
      @Param("language") String language, @Param("limit") int limit);

  Page<StudyBook> findByIsSystemProblemAndLanguageContainingIgnoreCase(
      Boolean isSystemProblem, String language, Pageable pageable);

  Page<StudyBook> findByIsSystemProblem(Boolean isSystemProblem, Pageable pageable);

  List<StudyBook> findByLanguageAndIsSystemProblem(String language, Boolean isSystemProblem);

  List<StudyBook> findByUserIdAndLanguageAndIsSystemProblem(
      UUID userId, String language, Boolean isSystemProblem);

  @Query("SELECT DISTINCT s.language FROM StudyBook s WHERE s.isSystemProblem = :isSystemProblem")
  List<String> findDistinctLanguagesByIsSystemProblem(
      @Param("isSystemProblem") Boolean isSystemProblem);

  @Query(
      "SELECT DISTINCT s.language FROM StudyBook s WHERE s.user.id = :userId AND s.isSystemProblem = :isSystemProblem")
  List<String> findDistinctLanguagesByUserIdAndIsSystemProblem(
      @Param("userId") UUID userId, @Param("isSystemProblem") Boolean isSystemProblem);

  @Query("SELECT DISTINCT s.language FROM StudyBook s ORDER BY s.language")
  List<String> findDistinctLanguages();
}
