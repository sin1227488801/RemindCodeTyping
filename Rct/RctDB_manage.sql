/*以下のSQLをすべてコピペして実行する、最後にEnterを押すのを忘れないように*/


graph
/*1-1.　データベースがない場合は作る

CREATE DATABASE RCT_DB_LOGIN_INFO;

*/


/*1-2.　こちらのコードをmysqlにコピー&ペーストする */
USE RCT_DB_LOGIN_INFO;

/*1-3.　こちらのコードをmysqlにコピー&ペーストする */
DROP TABLE IF EXISTS `LOGIN_INFO`;

/*1-4.　こちらのコードをmysqlにコピー&ペーストする */
CREATE TABLE `LOGIN_INFO` (
  `key` INT NOT NULL AUTO_INCREMENT,
  `login_id` VARCHAR2(10) NOT NULL,
  `password_hash` CHAR(32) NOT NULL,
  `last_login_date` DATE NOT NULL,
  `last_login_days` INT NOT NULL,
  `max_login_days` INT NOT NULL,
  `total_login_days` INT NOT NULL,
  `create_date_time` TIMESTAMP NOT NULL,
  `update_date_time` TIMESTAMP NOT NULL,
  PRIMARY KEY (`key`)
);

/*1-5.　こちらのコードをmysqlにコピー&ペーストする 
        ※Demo play用アカウント作成時に利用予定
INSERT INTO `LOGIN_INFO` VALUES (1,'guest','※ ハッシュ値?'); */



/*2-1.　データベースがない場合は作る

CREATE DATABASE RCT_DB_STUDY_BOOK;

*/


/*2-2.　こちらのコードをmysqlにコピー&ペーストする */
USE RCT_DB_STUDY_BOOK;

/*2-3.　こちらのコードをmysqlにコピー&ペーストする */
DROP TABLE IF EXISTS `STUDY_BOOK`;

/*2-4.　こちらのコードをmysqlにコピー&ペーストする */
CREATE TABLE `STUDY_BOOK` (
  `key` INT NOT NULL AUTO_INCREMENT,
  `login_info_key` VARCHAR2(10) NOT NULL,
  `language` VARCHAR2(10) NOT NULL,
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `description` TEXT,
  `create_date_time` TIMESTAMP NOT NULL,
  `update_date_time` TIMESTAMP NOT NULL,
  PRIMARY KEY (`key`),
  FOREIGN KEY (`login_info_key`) REFERENCES LOGIN_INFO(`key`)
);

/*2-5.　こちらのコードをmysqlにコピー&ペーストする 
        ※事前に挿入したいデータがあれば利用
INSERT INTO `STUDY_BOOK` VALUES (1,'guest','※ ハッシュ値?'); */



/*3-1.　データベースがない場合は作る

CREATE DATABASE RCT_DB_TYPING_LOG;

*/


/*3-2.　こちらのコードをmysqlにコピー&ペーストする */
USE RCT_DB_TYPING_LOG;

/*3-3.　こちらのコードをmysqlにコピー&ペーストする */
DROP TABLE IF EXISTS `TYPING_LOG`;

/*3-4.　こちらのコードをmysqlにコピー&ペーストする */
CREATE TABLE `TYPING_LOG` (
  `key` INT NOT NULL AUTO_INCREMENT,
  `login_info_key` VARCHAR2(10) NOT NULL,
  `study_book_key` VARCHAR2(10) NOT NULL,
  `user_input` TEXT NOT NULL,
  `total_amount` NUMBER(10) NOT NULL,
  `total_score` NUMBER(10) NOT NULL,
  `accuracy` DECIMAL(5,2) NOT NULL,
  `score` NUMBER(3) NOT NULL,
  `answer_time` TIME NOT NULL,
  `lank` VARCHAR2(10) NOT NULL,
  `create_date_time` TIMESTAMP NOT NULL,
  `update_date_time` TIMESTAMP NOT NULL,
  PRIMARY KEY (`key`),
  FOREIGN KEY (`login_info_key`) REFERENCES LOGIN_INFO(`key`),
  FOREIGN KEY (`study_book_key`) REFERENCES STUDY_BOOK(`key`)
);

/*3-5.　こちらのコードをmysqlにコピー&ペーストする 
        ※事前に挿入したいデータがあれば利用
INSERT INTO `TYPING_LOG` VALUES (1,'guest','※ ハッシュ値?'); */



/*4-1.　データベースがない場合は作る

CREATE DATABASE RCT_DB_RULE;

*/


/*4-2.　こちらのコードをmysqlにコピー&ペーストする */
USE RCT_DB_RULE;

/*4-3.　こちらのコードをmysqlにコピー&ペーストする */
DROP TABLE IF EXISTS `RULE`;

/*4-4.　こちらのコードをmysqlにコピー&ペーストする */
CREATE TABLE `RULE` (
  `key` INT NOT NULL AUTO_INCREMENT,
  `rule` VARCHAR2(10) NOT NULL,
  PRIMARY KEY (`key`),
);

/*4-5.　こちらのコードをmysqlにコピー&ペーストする 
        ※事前に挿入したいデータがあれば利用
INSERT INTO `RULE` VALUES (1,'guest','※ ハッシュ値?'); */