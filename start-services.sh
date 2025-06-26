#!/bin/bash

# A simple script to interactively ask for a volume name
# and then launch the Docker Compose stack.

# --- Step 1: Find available Docker volumes ---
echo "Searching for available Docker volumes..."
docker volume ls
echo "----------------------------------------------------"


# --- Step 2: Prompt the user for input ---
# 'read -p' displays a prompt without a newline
read -p "Please enter the NAME of the volume you want to connect to: " user_volume_name


# --- Step 3: Check if the user entered anything ---
if [ -z "$user_volume_name" ]; then
    echo "No volume name entered. Aborting."
    exit 1
fi


# --- Step 4: Run Docker Compose with the user's input ---
echo "Starting services and connecting to volume: $user_volume_name"
echo "----------------------------------------------------"

# This is the key command. It sets the environment variable SHARED_LOG_VOLUME
# to whatever the user typed, and then runs docker-compose.
SHARED_LOG_VOLUME=$user_volume_name docker-compose up
