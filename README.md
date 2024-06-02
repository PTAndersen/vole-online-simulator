The URL for HTTP request to the server from the client needs to be updated for production. In this file it is set to the localhost created with Node.

A ".env" needs to be created locally after cloning, it should look like this:

# .env file
JWT_SECRET=yoursecretkey
JWT_EXPIRATION=24h
DATABASE_URL="file:./dev.db"


This setup will create a local database for testing
