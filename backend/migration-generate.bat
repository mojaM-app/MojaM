@REM run when you want to generate a new migration when there are changes in the database schema
@REM Usage, run consol command: .\migration-generate.bat migration-name
npm run migration:generate src/dataBase/migrations/%1
