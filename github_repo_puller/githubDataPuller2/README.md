What is the app for?
Pull star repositories of random active users using github api. 

Project Dependency:
Redis is required.

How to run:
First run a redis server on the default port 6379
Then run the command: node index.js <git-personal-tokens>
Use ":" to seperate tokens
For example, 
node index.js 8shshhs7:sjhh9shsj
The more token given, the more data the app can pull before api calls expired

The data will be stored on the same redis server. 
