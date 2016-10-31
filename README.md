# Проект Сбербанк-Вместе
## Зависимости проекта
- Debian 3.16.7-ckt25-1
- NodeJS 4.4.7
- PostgreSQL 9.5.3
- supervisord 3.3.1
- Apache Ant 1.9.4
- Redis 2.8.17

### Запуск проекта
1. Клонировать проект
  ```sh
  git clone git@github.com:c7s/sber-together-api.git
  ```
2. Установить зависимости
  ```sh
  npm install
  ```
3. Собрать конфиги. Аргумент env - окружение (dev/qa/prod/demo/emul)
  ```sh
  npm run config {env}
  ```
4. Создать базу данных
  ```sh
  psql postgres
  CREATE DATABASE "sber-together-api";
  \q
  ```
5. Выполнить миграции
  ```sh
  npm run migrate
  ```
6. Собрать apidoc
  ```sh
  node_modules/.bin/gulp apidoc
  ```
7. Собрать фронтенд
  ```sh
  node_modules/.bin/gulp frontend
  ```
8. Запустить микросервисы
  ```sh
  npm run start-auth
  npm run start-users
  ```
  Для машин разработчиков
  ```sh
  npm run start-auth-dev
  npm run start-users-dev
  ```
9. Запустить приложение
  ```sh
  node app/app.js
  ```
  
#### Прямой доступ к api через интерфейс
Перед запуском проекта в теринале выполнить `export NODE_ENV=development`
Документация по api будет доступна по `/doc`
Панель для отладки запросов будет доступна по `/dev/api`

### Запуск интеграционных тестов
1. Собрать конфиги с окружением emul
  ```sh
  npm run config emul
  ```
2. Создать базу данных для эмулятора эквайринга
  ```sh
  psql postgres
  CREATE DATABASE "sber-emulator";
  \q
  ```
3. Собрать конфиги и выполнить миграции эмулятора
  ```sh
  cd sber-emulator
  npm run config
  npm run migrate
  ```
4. Запустить эмулятор
  ```sh
  node app/app.js
  ```
5. Запустить интеграционные тесты
  ```sh
  cd ../integration-tests
  ./runTests
  ```

### Автоматическая сборка
На проекте настроена автоматическая сборка iOS и Android приложений
Скрипт сборки https://github.com/c7s/sber-together/bin/deploy

### Cron скрипты
Добавляются в sber-together-api.crontab
В стандартном формате для cron:
```cron
0 12 * * * /opt/sber-together-api/current/app/scripts/monthlyPayments.sh
```
вместо исходного расширения файла (.js) ставится .sh
