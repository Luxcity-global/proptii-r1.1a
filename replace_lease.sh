#!/bin/bash
FILES=$(find /home/angelidev/Desktop/luxcity/proptii-r1.1a/src/landlord_agent/src/components -type f -name "*.tsx")

for FILE in $FILES; do
  sed -i 's/Lease Expiring/Rent Expiring/g' "$FILE"
  sed -i 's/Lease status/Rent status/g' "$FILE"
  sed -i 's/Lease End/Rent End/g' "$FILE"
  sed -i 's/Lease End:/Rent End:/g' "$FILE"
  sed -i 's/Highest Lease/Highest Rent/g' "$FILE"
  sed -i 's/Lease expiring/Rent expiring/g' "$FILE"
  sed -i 's/lease agreements/rent agreements/g' "$FILE"
  sed -i 's/fill lease terms/fill rent terms/g' "$FILE"
  sed -i 's/Lease terms/Rent terms/g' "$FILE"
  sed -i 's/Lease dates/Rent dates/g' "$FILE"
  sed -i 's/Lease start/Rent start/g' "$FILE"
  sed -i 's/Lease end/Rent end/g' "$FILE"
  sed -i 's/lease start/rent start/g' "$FILE"
  sed -i 's/lease end/rent end/g' "$FILE"
  sed -i 's/whose lease has ended/whose rent has ended/g' "$FILE"
  sed -i 's/lease dates/rent dates/g' "$FILE"
  sed -i 's/leases, rent collections/rent agreements, rent collections/g' "$FILE"
done
