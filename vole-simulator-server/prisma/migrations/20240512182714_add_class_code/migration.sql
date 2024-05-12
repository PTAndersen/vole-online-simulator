/*
  Warnings:

  - Added the required column `classCode` to the `Classroom` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Classroom" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "classCode" TEXT NOT NULL,
    "teacherId" INTEGER NOT NULL,
    CONSTRAINT "Classroom_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Classroom" ("id", "name", "teacherId") SELECT "id", "name", "teacherId" FROM "Classroom";
DROP TABLE "Classroom";
ALTER TABLE "new_Classroom" RENAME TO "Classroom";
CREATE UNIQUE INDEX "Classroom_classCode_key" ON "Classroom"("classCode");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
