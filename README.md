# BLINK

## [Deployed Link](https://blinkchat.netlify.app/)


## Overview

Full-stack Slack clone where users can create and join different channels and chat with other users in real-time. Built with the MERN stack using the MVC system for organizing the code. Utilizes socket.io for bidirectional event-based communication between clients and server for chat functionality. Created with HTML, CSS, JavaScript, React, MongoDB, Mongoose, Express, and Node.js.

## User Stories
```
- As an unregisterd user, I would like to sign up with email & password.
- As a registered user, I would like to sign in with email & password.
- As a signed in user, I would like to change password.
- As a signed in user, I would like to sign out.
- As a signed in user, I would like to send a chat message (socket).
- As a signed in user, I would like to create my own channels.
- As a signed in user and authorized owner of a channel, I would like to edit and update channel details.
- As a signed in user and authorized owner of a channel, I would like to delete my own channels.
- As a signed in user in a channel, I would like to see the messages in a chat (socket).
- As a signed in user, I would like to create my own profile.
- As a signed in user, I would like to update my own profile.
- As a signed in user, I would like to delete my profile.
```

## Technologies
    - HTML
    - CSS
    - JavaScript
    - React
    - Mongoose
    - MongoDB
    - Express
    - Node.js
    - Socket.io (library that enables low-latency, bidirectional, and event-based communication between a client and a server -- for chat functionality)

## ERD
![ERD](images/BLINK_ERD.png)

## Route Tables

### Users

| **URL**              | **HTTP Verb** |**Actions**
|----------------------|---------------|-----------
| /sign-out            | DELETE        | destroy   
| /change-password     | PATCH         | update         
| /sign-in             | POST          | create           
| /sign-up             | POST          | new               
| /users               | GET           | index             

### Channels

| **URL**                                   | **HTTP Verb** |**Actions**
|-------------------------------------------|---------------|-----------
| /channels                                 | GET           | index
| /channels/mine                            | GET           | index(user's)
| /channels/:id                             | GET           | show
| /channels/                                | POST          | create
| /channels/:id                             | PATCH         | update      
| /channels/thread/:channelId/:threadId     | PATCH         | update(add thread to channel)   
| /channels/:channelId/:addOrRemove/:userId | PATCH         | update(add/remove member to/from channel)   
| /channels/:id          | DELETE        | destroy     

### Threads

| **URL**                       | **HTTP Verb** |**Actions**
|-------------------------------|---------------|-----------
| /threads                      | GET           | index
| /threads/channel              | GET           | index(threads in channel)
| /threads/:id/                 | GET           | show  
| /threads                      | POST          | create  
| /threads/:id                  | PATCH         | update  
| /threads/:threadId/:messageId | PATCH         | update(reply to a thread)
| /threads/:threadId/:channelId | DELETE        | destroy(delete thread from channel)

## Screenshots

### Channel

![HOME](images/channel.png)

### Auth

![HOME](images/Wireframe%20-%202.png)

### Profile

![HOME](images/Wireframe%20-%203.png)

## Component Diagram

![Component_Diagram](images/component_diagram.png)

## Stretch Goals
    - upload for user profile photos
    - message text formatting
    - message photo uploading
    - ability for user to search through messages
    - direct messaging between users (can this be done using the channels model? set channel name as the two users' usernames and )