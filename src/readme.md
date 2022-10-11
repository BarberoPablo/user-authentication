Notes:

- Create a .env file with ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET to make it work.
- request.rest its an extension for making the Querys
- Hashing ≠ Encription:
  - Encription: is two-way, the data can be decrypted so it is readable again.
  - Hashing: is one-way, meaning the plaintext is scrambled into a unique digest, through the use of a "salt", that cannot be decrypted.

Workflow:

(1) Register --> (2) Login --> (3) Querys --> (4) Logout

1. User's information is stored with the password hashed.
2. Upon logging in, an access token with an expired date is created.
3. If the token is valid and didn't expired, the user has access to certain private routes/querys.
4. When logging out, the access token its destroyed and is no longer valid.
