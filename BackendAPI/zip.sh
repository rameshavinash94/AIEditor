#!/bin/bash

# Directory containing the folders to be zipped
directory="/Users/avinash/Desktop/BackendAPI/"

# Loop through each subdirectory in the given directory
for folder in "$directory"/*; do
    # Check if the item is a directory
    if [ -d "$folder" ]; then
        # Extract the folder name without the path
        folder_name=$(basename "$folder");
        echo "---printing folder----"
        echo "$folder_name";
        cd $folder_name;
        # Zip the folder into a separate zip file
        zip -r "../$folder_name.zip" *
        cd $directory;
    fi
done