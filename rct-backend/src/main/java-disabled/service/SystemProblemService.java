package com.rct.service;

import com.rct.entity.StudyBook;
import com.rct.repository.StudyBookRepository;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemProblemService implements CommandLineRunner {

  private final StudyBookRepository studyBookRepository;

  @Override
  @Transactional
  public void run(String... args) throws Exception {
    // システム問題が既に存在するかチェック
    long systemProblemCount = studyBookRepository.countByIsSystemProblem(true);
    if (systemProblemCount > 0) {
      log.info("System problems already loaded. Count: {}", systemProblemCount);
      return;
    }

    log.info("CSV loading temporarily disabled for testing");
    // TODO: CSVファイルの形式を修正後に有効化
    // log.info("Loading system problems from CSV...");
    // loadSystemProblemsFromCsv();
    // log.info("System problems loaded successfully.");
  }

  private void loadSystemProblemsFromCsv() throws Exception {
    ClassPathResource resource = new ClassPathResource("data/system_problems.csv");

    try (BufferedReader reader =
        new BufferedReader(
            new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

      String line;
      boolean isFirstLine = true;

      while ((line = reader.readLine()) != null) {
        // ヘッダー行をスキップ
        if (isFirstLine) {
          isFirstLine = false;
          continue;
        }

        String[] parts = parseCsvLine(line);
        if (parts.length >= 3) {
          StudyBook systemProblem = new StudyBook();
          systemProblem.setId(UUID.randomUUID());
          // システム問題はユーザーに紐づかないため、user_idをnullにできるようにする
          systemProblem.setLanguage(parts[0].trim());
          systemProblem.setQuestion(parts[1].trim().replace("\"\"", "\""));
          systemProblem.setExplanation(parts[2].trim());
          systemProblem.setIsSystemProblem(true);
          systemProblem.setCreatedBy("system");

          studyBookRepository.save(systemProblem);
        }
      }
    }
  }

  /** CSV行をパースする（ダブルクォート内のカンマを考慮） */
  private String[] parseCsvLine(String line) {
    java.util.List<String> result = new java.util.ArrayList<>();
    boolean inQuotes = false;
    StringBuilder currentField = new StringBuilder();

    for (int i = 0; i < line.length(); i++) {
      char c = line.charAt(i);

      if (c == '"') {
        if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
          // エスケープされたダブルクォート
          currentField.append('"');
          i++; // 次の文字をスキップ
        } else {
          // クォートの開始/終了
          inQuotes = !inQuotes;
        }
      } else if (c == ',' && !inQuotes) {
        // フィールドの区切り
        result.add(currentField.toString());
        currentField = new StringBuilder();
      } else {
        currentField.append(c);
      }
    }

    // 最後のフィールドを追加
    result.add(currentField.toString());

    return result.toArray(new String[0]);
  }
}
