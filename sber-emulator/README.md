# node-backend-boilerplate
## Как развернуть проект
1) Установить зависимости:  
`npm install`
2) Собрать конфиги:
`npm run config`
3) Создать бд:
```
psql postgres
create database "node-boilerplate";
\q
```
4) Выполнить миграции:  
`npm run migrate`  
5) Собрать документацию:  
`gulp doc`  
6) Запустить сервер:  
 `node app/app.js`  
 Дебаг панель находится по адресу **/api**, документация - **/doc**
