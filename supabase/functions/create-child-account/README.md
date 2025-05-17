# create-child-account Edge Function

This Supabase Edge Function allows an authenticated adult user to create a child account.

## Environment variables
- `SUPABASE_URL` – Supabase project URL
- `SUPABASE_ANON_KEY` – anonymous API key used for verifying JWT tokens
- `SUPABASE_SERVICE_ROLE_KEY` – service role key required to create new users

## HTTP request
`POST /functions/v1/create-child-account`

### Headers
- `Authorization: Bearer <parent_access_token>`
- `Content-Type: application/json`

### Body
```json
{
  "email": "child@example.com",
  "password": "strongpassword"
}
```

### Response
```json
{
  "success": true,
  "user_id": "<new-child-user-id>"
}
```

If the caller is not authenticated as an adult user, the function returns an error message with the appropriate status code.

