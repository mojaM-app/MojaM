# Description: Build the project for testing

echo ">>>>>>>>>> Removing dist folder"
WORKING_DIR=./dist
if [ -d "$WORKING_DIR" ]; then rm -Rf $WORKING_DIR; fi
WORKING_DIR=./dist/src

echo ">>>>>>>>>> Checking code style"
npm run lint || { echo "Linting failed. Exiting..."; exit 1; }

echo ">>>>>>>>>> Checking file dependencies"
npm run check-dependencies || { echo "Checking failed. Exiting..."; exit 1; }

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

echo ">>>>>>>>>> Removing userTestHelpers from users module"
USERS_INDEX_FILE="$WORKING_DIR/modules/users/index.js"
if [ -f "$USERS_INDEX_FILE" ]; then
    echo "Cleaning userTestHelpers from JavaScript file..."

    # Use sed to remove userTestHelpers dynamically while preserving the rest
    # Step 1: Remove the userTestHelpers export from the _export block
    sed '/userTestHelpers: function()/,/}/d' "$USERS_INDEX_FILE" > "$USERS_INDEX_FILE.tmp1"

    # Step 2: Remove the import line for test helpers
    sed '/_testhelpers/d' "$USERS_INDEX_FILE.tmp1" > "$USERS_INDEX_FILE.tmp2"

    # Step 3: Remove the variable declaration and conditional block
    sed '/^let userTestHelpers;$/,/^}$/d' "$USERS_INDEX_FILE.tmp2" > "$USERS_INDEX_FILE.tmp3"

    # Step 4: Clean up any syntax issues (trailing commas before closing braces)
    sed 's/,\s*}/}/' "$USERS_INDEX_FILE.tmp3" > "$USERS_INDEX_FILE.tmp4"

    # Replace the original file
    mv "$USERS_INDEX_FILE.tmp4" "$USERS_INDEX_FILE"

    # Clean up temporary files
    rm -f "$USERS_INDEX_FILE.tmp"*

    echo "userTestHelpers removed from $USERS_INDEX_FILE"
else
    echo "Warning: $USERS_INDEX_FILE not found"
fi

echo ">>>>>>>>>> Deleting all map files"
find "$WORKING_DIR" -type f -name '*.map' -delete

echo ">>>>>>>>>> Finished"
echo ">>>>>>>>>> Copy files from "$WORKING_DIR" to the server"
