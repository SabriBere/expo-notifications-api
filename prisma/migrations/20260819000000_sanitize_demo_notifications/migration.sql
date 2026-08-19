PRAGMA foreign_keys=OFF;

CREATE TABLE "DemoNotification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemId" INTEGER NOT NULL,
    "contextId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "link" TEXT NOT NULL
);

INSERT INTO "DemoNotification" (
    "id",
    "itemId",
    "contextId",
    "title",
    "sourceType",
    "source",
    "category",
    "link"
)
SELECT
    "id",
    "NoticiaId",
    "ConsultasId",
    "Title",
    CASE "MediaType"
        WHEN 1 THEN 'print'
        WHEN 2 THEN 'web'
        WHEN 3 THEN 'tv'
        WHEN 4 THEN 'radio'
        ELSE 'other'
    END,
    "Media",
    "Section",
    "Link"
FROM "Alert";

DROP TABLE "Alert";

CREATE UNIQUE INDEX "DemoNotification_itemId_key"
ON "DemoNotification"("itemId");

CREATE UNIQUE INDEX "DemoNotification_contextId_key"
ON "DemoNotification"("contextId");

PRAGMA foreign_keys=ON;
