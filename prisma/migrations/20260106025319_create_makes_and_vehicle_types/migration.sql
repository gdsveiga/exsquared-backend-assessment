-- CreateTable
CREATE TABLE "Make" (
    "id" SERIAL NOT NULL,
    "makeId" INTEGER NOT NULL,
    "makeName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Make_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleType" (
    "id" SERIAL NOT NULL,
    "typeId" INTEGER NOT NULL,
    "typeName" TEXT NOT NULL,
    "makeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Make_makeId_key" ON "Make"("makeId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleType_makeId_typeId_key" ON "VehicleType"("makeId", "typeId");

-- AddForeignKey
ALTER TABLE "VehicleType" ADD CONSTRAINT "VehicleType_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "Make"("makeId") ON DELETE RESTRICT ON UPDATE CASCADE;
