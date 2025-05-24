const { IgApiClient } = require('instagram-private-api');
const readline = require('readline');

class InstagramDM {
    constructor() {
        this.ig = new IgApiClient();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async login(username, password) {
        try {
            // Basic setup
            this.ig.state.generateDevice(username);
            await this.ig.simulate.preLoginFlow();
            
            // Login
            const loggedInUser = await this.ig.account.login(username, password);
            await this.ig.simulate.postLoginFlow();
            
            console.log('Successfully logged in!');
            return true;
        } catch (err) {
            console.error('Login failed:', err.message);
            return false;
        }
    }

    async sendDirectMessage(recipientUsername, message) {
        try {
            // Get user ID from username
            const user = await this.ig.user.searchExact(recipientUsername);
            if (!user) {
                console.error('User not found');
                return false;
            }

            // Get existing thread or create new one
            const threads = await this.ig.direct.getInbox();
            let thread = threads.inbox.threads.find(t => 
                t.users.some(u => u.pk === user.pk)
            );

            if (!thread) {
                // Create new thread
                const result = await this.ig.direct.createGroupThread([user.pk.toString()]);
                thread = result.thread;
            }

            // Send message
            await this.ig.direct.send({
                threadIds: [thread.thread_id],
                text: message
            });

            console.log(`Message sent successfully to ${recipientUsername}!`);
            return true;
        } catch (err) {
            console.error('Error sending message:', err.message);
            return false;
        }
    }

    async getInbox() {
        try {
            const inbox = await this.ig.direct.getInbox();
            const threads = inbox.inbox.threads;
            
            console.log('\nRecent conversations:');
            threads.forEach(thread => {
                const users = thread.users.map(u => u.username).join(', ');
                console.log(`- ${users}`);
            });
            
            return threads;
        } catch (err) {
            console.error('Error fetching inbox:', err.message);
            return null;
        }
    }

    async start() {
        console.log('Instagram DM CLI Tool');
        console.log('---------------------');

        // Login
        const username = await this.prompt('Enter your Instagram username: ');
        const password = await this.prompt('Enter your Instagram password: ');
        
        const loggedIn = await this.login(username, password);
        if (!loggedIn) {
            console.log('Exiting due to login failure');
            this.rl.close();
            return;
        }

        while (true) {
            console.log('\nOptions:');
            console.log('1. Send a message');
            console.log('2. View conversations');
            console.log('3. Exit');

            const choice = await this.prompt('Enter your choice (1-3): ');

            switch (choice) {
                case '1':
                    const recipientUsername = await this.prompt('Enter recipient username: ');
                    const message = await this.prompt('Enter your message: ');
                    await this.sendDirectMessage(recipientUsername, message);
                    break;

                case '2':
                    await this.getInbox();
                    break;

                case '3':
                    console.log('Goodbye!');
                    this.rl.close();
                    return;

                default:
                    console.log('Invalid choice. Please try again.');
            }
        }
    }

    prompt(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }
}

// Create and start the CLI app
const instagramDM = new InstagramDM();
instagramDM.start().catch(err => {
    console.error('An error occurred:', err);
    process.exit(1);
});

module.exports = InstagramDM;
