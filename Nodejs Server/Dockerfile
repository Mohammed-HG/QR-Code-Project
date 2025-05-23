#  Users node version 22.2 as our base image
FROM node:22.2 

# Goes to the app directory (think of it like a cd terminal command)
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of app into the container
COPY . .

# Set port environment variable
ENV PORT=3200

#Expose the port so our computer can access it 
EXPOSE 9000

# Run the app
CMD ["npm", "start"]

