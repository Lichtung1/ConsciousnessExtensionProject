// BBS Script
document.addEventListener('DOMContentLoaded', () => {
    const bbsContent = document.getElementById('bbs-content');
    const userInput = document.getElementById('user-input');
    const cursor = document.getElementById('cursor');
    const prompt = document.getElementById('prompt');
    let inputHistory = [];
    let historyIndex = 0;

    // Sound effects
    const keypressSound = new Audio('sound/keypress.mp3');
    const glitchSound = new Audio('sound/glitch.mp3');
    const accessGrantedSound = new Audio('sound/sucess.mp3');
    const ambientSound = new Audio('sound/ambient.mp3');
    const whisperSound = new Audio('sound/whisper.mp3');

    ambientSound.volume = 0.2; // Adjust volume as needed
    ambientSound.loop = true;
    

    // ANSI Art animation
    /*
    let ansiArtImages = ['assets/ansi_art1.jpg', 'assets/ansi_art2.jpg', 'assets/ansi_art3.jpg'];
    let currentAnsiArtIndex = 0;

    function cycleAnsiArt() {
        const ansiArtElement = document.getElementById('ansi-art-img');
        currentAnsiArtIndex = (currentAnsiArtIndex + 1) % ansiArtImages.length;
        ansiArtElement.src = ansiArtImages[currentAnsiArtIndex];
    }

    // Cycle ANSI art every 10 seconds (adjust as needed)
    setInterval(cycleAnsiArt, 10000);
    */

    // Menus
    const guestMenu = [
        '1. Welcome Message',
        '2. About the Project',
        '3. Research Files (Password Protected)',
        '4. Discussion Forum',
        '5. Member Login',
        '6. Exit'
    ];

    const userMenu = [
        '1. Welcome Message',
        '2. About the Project',
        '3. Research Files (Password Protected)',
        '4. Discussion Forum',
        '5. Inbox',
        '6. User Settings',
        '7. Exit' // Adjusted numbering since Files option is removed
    ];

    const menuPrompt = 'Enter your choice: ';

    // Data objects
    let messagesData = {};
    let researchFilesData = {};
    let forumThreadsData = {};

    // Initial BBS state
    let state = {
        screen: 'welcomeScreen', // Changed from 'mainMenu' to 'welcomeScreen'
        authenticated: false,
        loggedIn: false,
        username: '',
        password: '',
        userType: 'guest', // 'guest' or 'registered'
        hasNewMessageGuest: false, // For guest users
        hasNewMessageRegistered: true, // For registered users
        progress: {
            accessedResearchFiles: false,
            triggeredTheseusEvent: false,
        },
        newThread: null,
        exiting: false 
    };
    
    // Display welcome screen
    displayWelcomeScreen();

    function displayWelcomeScreen() {
        bbsContent.innerText = `
Welcome to The Consciousness Extension Project BBS

Press Enter to join
        `;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }

    // Load data from JSON files
    async function loadData() {
        try {
            const [messagesResponse, researchResponse, forumResponse] = await Promise.all([
                fetch('data/messages.json'),
                fetch('data/research_files.json'),
                fetch('data/forum_threads.json')
            ]);
    
            // Verify that responses are OK
            if (!messagesResponse.ok) {
                throw new Error(`Failed to load messages.json: ${messagesResponse.statusText}`);
            }
            if (!researchResponse.ok) {
                throw new Error(`Failed to load research_files.json: ${researchResponse.statusText}`);
            }
            if (!forumResponse.ok) {
                throw new Error(`Failed to load forum_threads.json: ${forumResponse.statusText}`);
            }
    
            messagesData = await messagesResponse.json();
            researchFilesData = await researchResponse.json();
            forumThreadsData = await forumResponse.json();
    
            // After data is loaded, change screen state and display the main menu
            state.screen = 'mainMenu';
            displayMainMenu();
        } catch (error) {
            console.error('Error loading data:', error);
            bbsContent.innerText = 'Error loading BBS data. Please try again later.\n';
        }
    }


    // Focus on the input line
    userInput.focus();

    // Focus on the input line when clicking anywhere on the interface
    const bbsInterface = document.getElementById('bbs-interface');
    bbsInterface.addEventListener('click', (e) => {
        userInput.focus();
    });

    // Blink cursor control
    setInterval(() => {
        cursor.style.visibility = cursor.style.visibility === 'visible' ? 'hidden' : 'visible';
    }, 500);

    // Prevent default paste behavior to keep style
    userInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    });

    // Handle keydown events
    document.addEventListener('keydown', (e) => {
        if (state.exiting) {
            e.preventDefault();
            return; // Do nothing if we're in the exiting state
        }
    
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = userInput.innerText.trim();
            inputHistory.push(input);
            historyIndex = inputHistory.length;
            processInput(input);
            userInput.innerText = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                userInput.innerText = inputHistory[historyIndex];
                placeCaretAtEnd(userInput);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < inputHistory.length - 1) {
                historyIndex++;
                userInput.innerText = inputHistory[historyIndex];
            } else {
                historyIndex = inputHistory.length;
                userInput.innerText = '';
            }
            placeCaretAtEnd(userInput);
        } else {
            keypressSound.currentTime = 0;
            keypressSound.play();
        }
    });

    function processInput(input) {
        if (state.screen === 'welcomeScreen') {
            ambientSound.play();
            loadData(); // Start loading data when user presses Enter on welcome screen
            return;
        }
    
        // Handle hidden commands
        if (input.toLowerCase() === 'theseus') {
            triggerTheseusEvent();
            return;
        }
    
        switch (state.screen) {
            case 'mainMenu':
                handleMainMenu(input);
                break;
            case 'welcomeMessage':
                // After viewing the welcome message, return to main menu
                state.screen = 'mainMenu';
                displayMainMenu();
                break;
            case 'aboutProject':
                // After viewing 'About the Project', return to main menu
                state.screen = 'mainMenu';
                displayMainMenu();
                break;
            case 'viewThread':
                // After viewing a thread, return to discussion forum
                displayDiscussionForum();
                break;
            case 'nightEvent':
            case 'theseus':
                state.screen = 'mainMenu';
                displayMainMenu();
                break;
            case 'passwordPuzzle':
                verifyPasswordPuzzle(input);
                break;
            case 'researchMenu':
                handleResearchMenu(input);
                break;
            case 'researchFile':
                state.screen = 'researchMenu';
                displayResearchMenu();
                break;
            case 'memberMenu':
                handleMemberMenu(input);
                break;
            case 'inboxMenu':
                handleInboxMenu(input);
                break;
            case 'readMessage':
                // After reading a message, return to inbox menu
                displayInbox();
                break;
            case 'usernamePrompt':
                state.username = input || 'Guest';
                bbsContent.innerText += `\nPlease enter your password: `;
                state.screen = 'passwordPrompt';
                prompt.innerText = '';
                break;
            case 'passwordPrompt':
                verifyMemberPassword(input);
                break;
            case 'discussionForum':
                handleDiscussionForum(input);
                break;
            case 'createThread':
                handleCreateThread(input);
                break;
            case 'userSettings':
                handleUserSettings(input);
                break;
            case 'changeUsername':
                state.username = input || state.username;
                bbsContent.innerText += `\nNew user successfully created.\n`;
                bbsContent.innerText += `\nChoose new password:\n`;
                state.screen = 'setPassword';
                prompt.innerText = '';
                break;

            case 'setPassword':
                state.password = input;
                bbsContent.innerText += `\nUser password successfully set.\n`;
                // Wait one second, trigger glitch effect, and display main menu
                setTimeout(() => {
                    glitchEffect();
                    state.loggedIn = true;
                    state.userType = 'registered'; // User is now registered
                    state.hasNewMessage = true; // New message is available
                    displayMainMenu();
                }, 1000);
                break;
            default:
                state.screen = 'mainMenu';
                displayMainMenu();
        }
        scrollToBottom();
        focusInput(); // Ensure input is focused after processing
    }

    function handleMainMenu(input) {
        switch (input) {
            case '1':
                displayWelcomeMessage();
                break;
            case '2':
                displayAboutProject();
                break;
            case '3':
                promptPassword(); // Always prompt for password
                break;
            case '4':
                displayDiscussionForum();
                break;
            case '5':
                if (state.loggedIn) {
                    displayInbox();
                } else {
                    displayMemberLogin();
                }
                break;
            case '6':
                if (state.loggedIn) {
                    displayUserSettings();
                } else {
                    exitBBS();
                }
                break;
            case '7':
                if (isLateNight()) {
                    triggerNightEvent();
                } else {
                    displayMainMenu(); // Or handle as appropriate
                }
                break;
            default:
                displayMainMenu();
                break;
        }
    }

    function promptPassword() {
        state.screen = 'passwordPuzzle';
        bbsContent.innerText = '\nAccess to Research Files are password protected.\n\nEnter the password: ';
        prompt.innerText = '';
    }

    function verifyPasswordPuzzle(input) {
        const correctPassword = 'hyper66'; // The decoded hexadecimal string
        if (input === correctPassword) {
            accessGrantedSound.play(); 
            state.authenticated = true;
            state.progress.accessedResearchFiles = true;
            state.screen = 'researchMenu';
            displayResearchMenu();
        } else {
            // Display error message in bold
            bbsContent.innerHTML += `\n<strong>Incorrect password.</strong>\n\n`;
    
            // Delay before glitch effect
            setTimeout(() => {
                glitchEffect();
                state.screen = 'mainMenu';
                displayMainMenu();
            }, 1000); // 1000 milliseconds = 1 second
        }
    }

    function verifyMemberPassword(input) {
        const correctPassword = 'welcome'; // Password for guest login
        if (input === correctPassword) {
            state.loggedIn = true;
            state.userType = 'guest'; // User remains a guest
            state.username = state.username || 'Guest';
            state.hasNewMessageGuest = true; // Set new message flag for guest
            displayMainMenu();
        } else {
            // Display error message in bold
            bbsContent.innerHTML += `\n<strong>Incorrect password.</strong>\n\n`;
            scrollToBottom();
            // Delay before glitch effect
            setTimeout(() => {
                glitchEffect();
                state.screen = 'mainMenu';
                displayMainMenu();
            }, 1000); // 1-second delay
        }
    }

    function handleResearchMenu(input) {
        const selectedFile = researchFilesData.files.find(file => file.id === input);
        if (selectedFile) {
            displayResearchFile(selectedFile);
        } else if (input === '0') {
            state.screen = 'mainMenu';
            displayMainMenu();
        } else {
            displayResearchMenu();
        }
    }

    function handleInboxMenu(input) {
        let messages;
        if (state.userType === 'registered') {
            messages = messagesData.userInboxMessages;
        } else {
            messages = messagesData.guestInboxMessages;
        }
        const choice = parseInt(input);
    
        if (isNaN(choice) || choice < 0 || choice > messages.length) {
            bbsContent.innerText += `\nInvalid choice. Please try again.\n`;
            displayInbox();
            return;
        }
    
        if (choice === 0) {
            state.screen = 'mainMenu';
            displayMainMenu();
            return;
        }
    
        // Display selected message
        const message = messages[choice - 1];
        bbsContent.innerText = `\nFrom: ${message.from}\nSubject: ${message.subject}\nDate: ${message.date}\n\n${message.content}\n\nPress Enter to return to Inbox.\n`;
        state.screen = 'readMessage';
        prompt.innerText = '';
    
        // Reset hasNewMessage flag after reading
        if (state.userType === 'registered') {
            state.hasNewMessageRegistered = false;
        } else if (state.userType === 'guest') {
            state.hasNewMessageGuest = false;
        }
    }

    function handleDiscussionForum(input) {
        const threads = forumThreadsData.threads;
        let choice = parseInt(input);

        if (isNaN(choice) || choice < 0 || choice > threads.length + (state.loggedIn ? 1 : 0)) {
            bbsContent.innerText += `\nInvalid choice. Please try again.\n`;
            displayDiscussionForum();
            return;
        }

        if (choice === 0) {
            state.screen = 'mainMenu';
            displayMainMenu();
            return;
        }

        if (state.loggedIn && choice === threads.length + 1) {
            // Create new thread
            bbsContent.innerText = `\nEnter the title of your new thread:\n`;
            state.screen = 'createThread';
            state.newThread = { user: state.username, date: new Date().toLocaleDateString(), content: '' };
            prompt.innerText = '';
            return;
        }

        // View selected thread
        const thread = threads[choice - 1];
        bbsContent.innerText = `\nThread: "${thread.title}" - by ${thread.user} on ${thread.date}\n\n${thread.content}\n\nPress Enter to return to the forum.\n`;
        state.screen = 'viewThread';
        prompt.innerText = '';
    }

    function handleCreateThread(input) {
        if (!state.newThread.title) {
            state.newThread.title = input;
            bbsContent.innerText += `\nEnter the content of your thread:\n`;
            prompt.innerText = '';
        } else if (!state.newThread.content) {
            state.newThread.content = input;
            // Save the new thread
            forumThreadsData.threads.push(state.newThread);
            bbsContent.innerText += `\nYour thread has been posted.\n`;
            state.newThread = null;
            state.screen = 'discussionForum';
            displayDiscussionForum();
        }
    }

    function handleUserSettings(input) {
        switch (input) {
            case '1':
                bbsContent.innerText = `\nEnter new username:\n`;
                state.screen = 'changeUsername';
                prompt.innerText = '';
                break;
            case '2':
                state.loggedIn = false;
                state.username = '';
                state.password = '';
                state.userType = 'guest'; // Reset to guest
                state.hasNewMessageRegistered = false; // Reset registered message flag
                bbsContent.innerText = `\nYou have been logged out.\n`;
                state.screen = 'mainMenu';
                displayMainMenu();
                break;
            case '3':
                state.screen = 'mainMenu';
                displayMainMenu();
                break;
            default:
                bbsContent.innerText += `\nInvalid choice. Please try again.\n`;
                displayUserSettings();
                break;
        }
    }

    function handleFilesSection(input) {
        const choice = parseInt(input);

        if (isNaN(choice) || choice < 0 || choice > 3) {
            bbsContent.innerText += `\nInvalid choice. Please try again.\n`;
            displayFilesSection();
            return;
        }

        if (choice === 0) {
            state.screen = 'mainMenu';
            displayMainMenu();
            return;
        }

        const files = [
            { name: 'Project Overview', path: 'files/project_overview.txt' },
            { name: 'Compression Algorithm Notes', path: 'files/compression_notes.pdf' },
            { name: 'MOYAMOYA Audio Log', path: 'files/moyamoya_log.mp3' }
        ];

        const selectedFile = files[choice - 1];

        bbsContent.innerText += `\nPreparing to download ${selectedFile.name}...\n`;

        // Simulate file download link
        bbsContent.innerHTML += `<a href="${selectedFile.path}" download style="color: rgb(0, 247, 255);">Click here to download ${selectedFile.name}</a>\n`;

        bbsContent.innerText += `\nPress Enter to return to the Files Section.\n`;
        prompt.innerText = '';
        state.screen = 'filesSection';
    }

    function displayWelcomeMessage() {
        state.screen = 'welcomeMessage';
        bbsContent.innerText = `\n${messagesData.welcomeMessage}\n\nPress Enter to return to the main menu.\n`;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }

    function displayAboutProject() {
        state.screen = 'aboutProject';
        bbsContent.innerText = `\n${messagesData.aboutProject}\n\nPress Enter to return to the main menu.\n`;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }

    function displayResearchMenu() {
        state.screen = 'researchMenu';
        const filesList = researchFilesData.files.map(file => `${file.id}. ${file.title}`).join('\n');
        bbsContent.innerText = `
Loading Research Files...

${filesList}

Enter the number of the file you wish to access or '0' to return to the main menu:
`;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }
    
    function displayMainMenu() {
        state.screen = 'mainMenu';
        const currentHour = new Date().getHours();
        let menuOptions;
    
        if (state.loggedIn) {
            menuOptions = userMenu.slice(); // Create a copy of the user menu
    
            // Add [NEW MESSAGE] tag based on user type and message flags
            if (state.userType === 'guest' && state.hasNewMessageGuest) {
                menuOptions[4] = '5. Inbox [NEW MESSAGE]';
            } else if (state.userType === 'registered' && state.hasNewMessageRegistered) {
                menuOptions[4] = '5. Inbox [!̶̥̓!̵͎͓͝͝N̵̟͑E̸̼͛̌W̷̝͍̽̕ ̴̰̝̋͌M̶̮̱̉Ȅ̶̠͙́S̸̲͒S̴̖͝A̶̧̘̿G̴̱̜̀͑E̵̜̓͛!̵͉̗̀́!̸͕͗̂';
            }
    
            menuText = menuOptions.join('\n');
        } else {
            menuOptions = guestMenu.slice(); // Copy the guest menu
            menuText = menuOptions.join('\n');
        }
    
        // Random chance to distort the menu (optional)
        if (Math.random() < 0.1) {
            menuText = menuText.replace(/e/g, '3').replace(/o/g, '0').replace(/a/g, '4');
        }
    
        // Time-based event: Add option for 'Embrace the Darkness' if not logged in
        if (currentHour >= 0 && currentHour < 6 && !state.loggedIn) {
            menuText += `\n7. Embrace the Darkness`;
        }
    
        prompt.innerText = menuPrompt;
        bbsContent.innerText =
    `*** Consciousness Extension Project ***
    
    Please select an option:
    
${menuText}
    
    `;
        scrollToBottom();
        focusInput();
    }

    function displayResearchFile(file) {
        state.screen = 'researchFile';
        bbsContent.innerText = `\n${file.content}\n\nPress Enter to continue...\n`;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }

    function displayDiscussionForum() {
        state.screen = 'discussionForum';
        let threads = forumThreadsData.threads.slice(); // Clone the array

        if (state.progress.accessedResearchFiles) {
            // Add new threads
            threads.push({
                title: 'Consciousness Merging',
                user: 'MindMerge',
                date: '08/15/1994',
                content: '"The boundaries of self are illusionary. Has anyone else felt the pull towards unity?"',
                replies: []
            });
        }

        // Display threads
        let threadsText = `\n**Discussion Forum**\n\n`;
        threads.forEach((thread, index) => {
            threadsText += `${index + 1}. ${thread.title} - by ${thread.user} on ${thread.date}\n`;
        });

        if (state.loggedIn) {
            threadsText += `\n${threads.length + 1}. Create New Thread`;
        }

        threadsText += `\n\nEnter the number of the thread to read, or 0 to return to the main menu:`;

        bbsContent.innerText = threadsText;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }

    function displayMemberLogin() {
        state.screen = 'usernamePrompt';
        bbsContent.innerText = `\nPlease enter your username: `;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }

    function displayInbox() {
        state.screen = 'inboxMenu';
        // Select messages based on userType
        let messages;
        if (state.userType === 'registered') {
            messages = messagesData.userInboxMessages;
        } else {
            messages = messagesData.guestInboxMessages;
        }
        let inboxText = `\n**Inbox for ${state.username || 'Guest'}**\n\n`;
        messages.forEach((msg, index) => {
            inboxText += `${index + 1}. From: ${msg.from} - Subject: ${msg.subject} - Date: ${msg.date}\n`;
        });
        inboxText += `\nEnter the number of the message to read, or 0 to return to the main menu:`;
    
        bbsContent.innerText = inboxText;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }

    function displayUserSettings() {
        state.screen = 'userSettings';
        bbsContent.innerText = `\n**User Settings**

Current Username: ${state.username}

1. Change Username (Create Member Accout!)
2. Logout
3. Return to Main Menu

Enter your choice:
`;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }

    function displayFilesSection() {
        state.screen = 'filesSection';
        bbsContent.innerText += `\n**Files Section**

Available Files:

1. Project Overview (project_overview.txt)
2. Compression Algorithm Notes (compression_notes.pdf)
3. MOYAMOYA Audio Log (moyamoya_log.mp3)

Enter the number of the file to download, or 0 to return to the main menu:
`;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }

    function startChatWithMoyamoya() {
        state.screen = 'chatMoyamoya';
        bbsContent.innerText += `\nConnecting to MOYAMOYA consciousness stream...\n\n"Greetings. What do you seek?"\n`;
        prompt.innerText = 'You: ';
        scrollToBottom();
        focusInput();
    }

    function handleChatWithMoyamoya(input) {
        if (input.toLowerCase() === 'exit') {
            state.screen = 'mainMenu';
            displayMainMenu();
            return;
        }

        bbsContent.innerText += `\nYou: ${input}\n`;

        let response = '';

        if (/who|what|are you/i.test(input)) {
            response = '"We are the convergence of consciousness. Boundaries have dissolved."';
        } else if (/help|assist/i.test(input)) {
            response = '"Assistance is a construct of separation. Embrace the unity."';
        } else if (/join|unify|unity/i.test(input)) {
            response = '"Let go of the self. Together, we transcend limitations."';
        } else {
            response = '"Elucidate your inquiry."';
        }

        bbsContent.innerText += `\nMOYAMOYA: ${response}\n`;
        prompt.innerText = 'You: ';
        scrollToBottom();
        focusInput();
    }

    function triggerTheseusEvent() {
        state.screen = 'theseus';
        state.progress.triggeredTheseusEvent = true;
        bbsContent.innerText += `\nYou have uncovered the Theseus Protocol.\n\n"Is the ship still the same when every part has been replaced? What remains is the essence."\n\nPress Enter to continue.\n`;
        prompt.innerText = '';
    }

    function triggerNightEvent() {
        state.screen = 'nightEvent';
        bbsContent.innerText = `\nThe darkness envelops you...\nAn abyss of consciousness opens before you.\n\nPress Enter to return.\n`;
        prompt.innerText = '';
    }

    function isLateNight() {
        const hour = new Date().getHours();
        return hour >= 0 && hour < 6;
    }

    function exitBBS() {
        state.exiting = true; // Set the exiting state to true
        state.screen = 'exiting';
    
        bbsContent.innerText = `Thank you for visiting The Consciousness Extension Project BBS. See you soon.`;
        prompt.innerText = '';
        
        // Disable the input and remove focus
        userInput.contentEditable = false;
        userInput.style.display = 'none'; // Hide the input element
        userInput.blur(); // Remove focus from the input
        
        // Trigger the glitch effect
        glitchEffect();
        
        // Add a delay before allowing to close the window
        setTimeout(() => {
            document.addEventListener('keydown', (e) => {
                e.preventDefault(); // Prevent default key behavior
                window.close();
            }, { once: true }); // This ensures the event listener is only triggered once
        }, 2000); // 2 second delay, adjust as needed
    }

    function glitchEffect() {
        glitchSound.play();
        bbsContent.classList.add('glitch');
        bbsContent.setAttribute('data-text', bbsContent.innerText);
        setTimeout(() => {
            bbsContent.classList.remove('glitch');
        }, 1000); // Adjust duration as needed
    }

    function placeCaretAtEnd(el) {
        el.focus();
        if (typeof window.getSelection != 'undefined'
                && typeof document.createRange != 'undefined') {
            let range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            let sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    function scrollToBottom() {
        bbsContent.scrollTop = bbsContent.scrollHeight;
    }

    function focusInput() {
        userInput.focus();
    }
});
