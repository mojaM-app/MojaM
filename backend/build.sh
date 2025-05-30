# Description: Build the project for testing

echo ">>>>>>>>>> Removing dist folder"
WORKING_DIR=./dist
if [ -d "$WORKING_DIR" ]; then rm -Rf $WORKING_DIR; fi
WORKING_DIR=./dist/src

echo ">>>>>>>>>> Checking code style"
npm run lint || { echo "Linting failed. Exiting..."; exit 1; }

echo ">>>>>>>>>> Testing the project"
npm run test || { echo "Tests failed. Exiting..."; exit 1; }

echo ">>>>>>>>>> Building the project"
npm run build

echo ">>>>>>>>>> Copying the package.json file"
cp package.json "$WORKING_DIR"/package.json
cp package-lock.json "$WORKING_DIR"/package-lock.json

echo ">>>>>>>>>> Deleting logs folder"
rm -rf "$WORKING_DIR"/logs

echo ">>>>>>>>>> Deleting all tests"
rm -rf "$WORKING_DIR"/utils/tests-events.utils.js
rm -rf "$WORKING_DIR"/utils/tests-events.utils.js.map
find "$WORKING_DIR" -name tests -exec rm -R "{}" \;
find "$WORKING_DIR" -type f -name '*.spec.*' -delete

echo ">>>>>>>>>> Deleting all map files"
find "$WORKING_DIR" -type f -name '*.map' -delete

echo ">>>>>>>>>> Finished"
echo ">>>>>>>>>> Copy files from "$WORKING_DIR" to the server"
