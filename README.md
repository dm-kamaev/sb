# sber-together-api

```sh
npm i
npm run config
npm run migrate
gulp apidoc
npm run start-users
npm run start-auth
node app/app

Внешние зависимости:
  {
    "PostgreSQL": "9.5.3",
    "Debian":     "3.16.7-ckt25-1",
  }

Cron:
Добавляются в sber-together-api.crontab
В стандартном формате для cron:
0 12 * * * /opt/sber-together-api/current/app/scripts/monthlyPayments.sh
вместо исходного расширения файла (.js) ставится .sh
```
