CREATE TABLE "Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Title" TEXT NOT NULL,
    "Tier" INTEGER NOT NULL,
    "Tone" INTEGER NOT NULL,
    "MediaType" INTEGER NOT NULL,
    "Media" TEXT NOT NULL,
    "Section" TEXT NOT NULL,
    "Link" TEXT NOT NULL,
    "ConsultasId" INTEGER NOT NULL,
    "NoticiaId" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "Alert_ConsultasId_key" ON "Alert"("ConsultasId");
CREATE UNIQUE INDEX "Alert_NoticiaId_key" ON "Alert"("NoticiaId");
