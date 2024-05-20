/*
  Warnings:

  - Added the required column `resultCell` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resultValue` to the `Exercise` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "randomCell" TEXT,
    "resultCell" TEXT NOT NULL,
    "resultValue" TEXT NOT NULL,
    "cycleConstraint" INTEGER,
    "mustUseInstructions" TEXT NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "classroomId" INTEGER NOT NULL,
    CONSTRAINT "Exercise_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Exercise_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Exercise" ("classroomId", "creatorId", "cycleConstraint", "description", "id", "mustUseInstructions", "name") SELECT "classroomId", "creatorId", "cycleConstraint", "description", "id", "mustUseInstructions", "name" FROM "Exercise";
DROP TABLE "Exercise";
ALTER TABLE "new_Exercise" RENAME TO "Exercise";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
