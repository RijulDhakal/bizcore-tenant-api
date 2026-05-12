SELECT "Id", "Email", "UserName" FROM "AspNetUsers" WHERE "Email" = 'rijuldhakal95@gmail.com';

UPDATE "AspNetUsers" 
SET "PasswordHash" = '$2a$11$6nq/dAybonoeXgFnut8HYeSJCIpg1AuYkcWUXTuZAz5PkPZ3W2.ni',
    "SecurityStamp" = gen_random_uuid()::text,
    "UpdatedAt" = NOW(),
    "IsFirstLogin" = FALSE
WHERE "Email" = 'rijuldhakal95@gmail.com';
