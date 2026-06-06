-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
