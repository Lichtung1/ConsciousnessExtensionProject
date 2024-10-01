//cd "C:\Users\George Dyck\Desktop\MoyaMoya Web\4 BBS_V2"
//python -m http.server 8000

// BBS Script
document.addEventListener('DOMContentLoaded', () => {
    const bbsContent = document.getElementById('bbs-content');
    const userInput = document.getElementById('user-input');
    const cursor = document.getElementById('cursor');
    const prompt = document.getElementById('prompt');
    let inputHistory = [];
    let historyIndex = 0;
    let inputAllowed = true;

    // Sound effects
    const keypressSound = new Audio('sound/keypress.mp3');
    const glitchSound = new Audio('sound/glitch.mp3');
    const accessGrantedSound = new Audio('sound/sucess.mp3');
    const ambientSound = new Audio('sound/ambient.mp3');
    const whisperSound = new Audio('sound/whisper.mp3');
    const startupSound= new Audio('sound/startupsound.mp3');

    ambientSound.volume = 0.5; 
    startupSound.volume = 0.4;
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
            const [messagesResponse, researchResponse, forumResponse, mainMenuResponse, moyamoyaResponse] = await Promise.all([
                fetch('data/messages.json'),
                fetch('data/research_files.json'),
                fetch('data/forum_threads.json'),
                fetch('data/main_menu.json'),
                fetch('data/moyamoya_dialogue.json')
            ]);
    
            // Verify that all responses are OK
            if (!messagesResponse.ok || !researchResponse.ok || !forumResponse.ok || !mainMenuResponse.ok || !moyamoyaResponse.ok) {
                throw new Error('Failed to load one or more JSON files');
            }
    
            messagesData = await messagesResponse.json();
            researchFilesData = await researchResponse.json();
            forumThreadsData = await forumResponse.json();
            const mainMenuData = await mainMenuResponse.json();
            const moyamoyaData = await moyamoyaResponse.json();
    
/*             console.log('Messages Data:', messagesData);
            console.log('Research Files Data:', researchFilesData);
            console.log('Forum Threads Data:', forumThreadsData);
            console.log('Main Menu Data:', mainMenuData);
            console.log('MOYAMOYA Dialogue Data:', moyamoyaData); */
    
            // Assign the data from messagesData to appropriate variables or state
            state.welcomeMessage = messagesData.welcomeMessage;
            state.aboutProject = messagesData.aboutProject;
            state.accessDenied = messagesData.accessDenied;
            state.guestInboxMessages = messagesData.guestInboxMessages;
            state.userInboxMessages = messagesData.userInboxMessages;
    
            // Assign main menu data
            state.guestMenu = mainMenuData.guestMenu;
            state.userMenu = mainMenuData.userMenu;
    
            // Assign MOYAMOYA dialogue data
            state.moyamoyaDialogue = moyamoyaData.moyamoya_dialogue;
    
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
        let whisperChance = 0.01; 
        if (!inputAllowed) {
            e.preventDefault();
            return;
        }
    
        if (state.screen === 'moyamoyaChat') {
            whisperChance = 0.00001; 
        }
    
        if (Math.random() < whisperChance) {
            whisperSound.play();
            glitchEffect();
        }

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
            setTimeout(() => {
                startupSound.play();
            }, 1000);
            loadData(); // Start loading data when user presses Enter on welcome screen
            return;
        }
    
        // Handle hidden commands
        if (input.toLowerCase() === 'theseus') {
            triggerTheseusEvent();
            return;
        }
    
        if (input.toLowerCase().trim() === "hello") {
            initiateMoyamoyaChat();
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
            case 'moyamoyaChat':
                handleMoyamoyaChat(input);
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
                if (state.loggedIn) {
                    exitBBS(); 
                } else if (isLateNight()) {
                    triggerNightEvent();
                } else {
                    displayMainMenu(); 
                }
                break;
            case '8': 
                if (state.loggedIn && isLateNight()) {
                    triggerNightEvent();
                } else {
                    displayMainMenu(); 
                }
                break;
            default:
                displayMainMenu();
                break;
        }
    }

    function promptPassword() {
        state.screen = 'passwordPuzzle';
        bbsContent.innerText = `
Access to Research Files is password protected.
Input syntax: Maintain precise spacing in your response, as inter-character voids are considered valid syntactical elements.
    
Enter the password (or '0' to return to main menu):
        `;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }
    
    function verifyPasswordPuzzle(input) {
        if (input === '0') {
            state.screen = 'mainMenu';
            displayMainMenu();
            return;
        }
    
        const correctPassword = 'contradiction of identity';
        if (input.toLowerCase() === correctPassword.toLowerCase()) {
            accessGrantedSound.play(); 
            state.authenticated = true;
            state.progress.accessedResearchFiles = true;
            state.screen = 'researchMenu';
            displayResearchMenu();
        } else {
            bbsContent.innerHTML += `\n<strong>Incorrect. Ensure accurate decoding and precise character representation, including inter-character voids.</strong>\n\n`;
            glitchEffect();
            
            // Re-display the password prompt after a short delay
            setTimeout(() => {
                promptPassword();
            }, 4000); 
        }
    }
    
    function verifyMemberPassword(input) {
        const correctPassword = 'Welcome'; // Password for guest login
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
        if (!state.authenticated) {
            bbsContent.innerHTML += `\n<strong>Access denied. Please enter the correct password first.</strong>\n\n`;
            promptPassword();
            return;
        }
    
        const selectedFile = researchFilesData.files.find(file => file.id === input);
        if (selectedFile) {
            displayResearchFile(selectedFile);
        } else if (input === '0') {
            state.screen = 'mainMenu';
            displayMainMenu();
        } else {
            bbsContent.innerHTML += `\n<strong>Invalid selection. Please try again.</strong>\n\n`;
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
        const currentDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const messageDate = message.date === '${currentDate}' ? currentDate : message.date;
    
        let messageContent = message.content.replace('${currentDate}', currentDate);
        
        // Convert markdown-style links to HTML links
        messageContent = messageContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
        bbsContent.innerHTML = `
From: ${message.from}
Subject: ${message.subject}
Date: ${messageDate}
    
    ${messageContent}
    
    Press Enter to return to Inbox.
        `;
        state.screen = 'readMessage';
        prompt.innerText = '';
    
        // Reset hasNewMessage flag after reading
        if (state.userType === 'registered') {
            state.hasNewMessageRegistered = false;
        } else if (state.userType === 'guest') {
            state.hasNewMessageGuest = false;
        }
    
        scrollToBottom();
        focusInput();
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
            
            // Check if the content contains the special command
            if (state.newThread.content.includes(`MOYAMOYA.init(${state.username})`)) {
                // Initiate Moyamoya chat
                initiateMoyamoyaChat();
            } else {
                // Save the new thread with user ID
                state.newThread.userId = state.username;
                forumThreadsData.threads.push(state.newThread);
                bbsContent.innerText += `\nYour thread has been posted.\n`;
                state.newThread = null;
                state.screen = 'discussionForum';
                displayDiscussionForum();
            }
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
        bbsContent.innerText = `\n${state.welcomeMessage}\n\nPress Enter to return to the main menu.\n`;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }
    
    function displayAboutProject() {
        state.screen = 'aboutProject';
        bbsContent.innerText = `\n${state.aboutProject}\n\nPress Enter to return to the main menu.\n`;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }

    function displayResearchMenu() {
        state.screen = 'researchMenu';
        const filesList = researchFilesData.files.map(file => {
            let fileInfo = `${file.id}. ${file.title}`;
            if (file.summary) {
                fileInfo += `\n\n${file.summary}`;
            }
            return fileInfo;
        }).join('\n\n');
        
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
        let content = `Title: ${file.title}\n\n${file.content}`;
        
        if (file.fileType === 'pdf') {
            const pdfPath = file.filePath;
            const absolutePdfPath = new URL(pdfPath, window.location.origin).href;
            
        }
    
        content += `\n\nPress Enter to return to the research menu.`;
    
        // Convert markdown-style links to HTML links
        content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
        bbsContent.innerHTML = content.replace(/\n/g, '<br>');
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
        
        const currentDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        
        messages.forEach((msg, index) => {
            let date = msg.date;
            if (date === '${currentDate}') {
                date = currentDate;
            }
            inboxText += `${index + 1}. From: ${msg.from} - Subject: ${msg.subject} - Date: ${date}\n`;
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

1. Change Username (Create Member Account!)
2. Logout
3. Return to Main Menu

Enter your choice:
`;
        prompt.innerText = '';
        scrollToBottom();
        focusInput();
    }

    //OLD FUNCTION DELETE?
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

    function initiateMoyamoyaChat() {
        state.screen = 'moyamoyaChat';
        state.currentMoyamoyaDialogueId = 1;
        bbsContent.innerText = '';
        prompt.innerText = '';
        inputAllowed = false;
        
        const connectionMessages = [
            'Establishing connection...',
            'Scanning quantum channels...',
            'Aligning neural interfaces...',
            'Connection established.'
        ];
    
        function displayConnectionMessages(index) {
            if (index < connectionMessages.length) {
                bbsContent.innerText += connectionMessages[index] + '\n';
                scrollToBottom();
                setTimeout(() => displayConnectionMessages(index + 1), 1000);
            } else {
                bbsContent.innerText += '\n';
                displayNextMoyamoyaMessage();
            }
        }
    
        displayConnectionMessages(0);
    }
    
    function displayNextMoyamoyaMessage() {
        const currentMessage = state.moyamoyaDialogue.find(msg => msg.id === state.currentMoyamoyaDialogueId);
        if (currentMessage) {
            const words = currentMessage.message.split(' ');
            let wordIndex = 0;
    
            inputAllowed = false;
    
            function displayNextWord() {
                if (wordIndex < words.length) {
                    bbsContent.innerText += words[wordIndex] + ' ';
                    scrollToBottom();
                    wordIndex++;
    
                    if (Math.random() < 0.1) {
                        whisperSound.play();
                    }
    
                    setTimeout(displayNextWord, 100);
                    scrollToBottom();
                } else {
                    bbsContent.innerText += '\n\n';
                    if (currentMessage.require_response) {
                        prompt.innerText = 'You: ';
                        inputAllowed = true;
                        focusInput();
                    } else {
                        state.currentMoyamoyaDialogueId++;
                        setTimeout(displayNextMoyamoyaMessage, 1000);
                    }
                }
            }
    
            bbsContent.innerText += 'MOYAMOYA: ';
            displayNextWord();
        } else {
            bbsContent.innerText += 'Connection terminated.\n';
            setTimeout(() => {
                state.screen = 'mainMenu';
                simulateSystemTakeover();
            }, 3000);
        }
    }
    
    function handleMoyamoyaChat(input) {
        if (!inputAllowed) return;
    
        inputAllowed = false;
        const words = input.split(' ');
        let wordIndex = 0;
    
        function displayNextWord() {
            if (wordIndex < words.length) {
                bbsContent.innerText += words[wordIndex] + ' ';
                scrollToBottom();
                wordIndex++;
                setTimeout(displayNextWord, 50); // Faster for user input
            } else {
                bbsContent.innerText += '\n\n';
                state.currentMoyamoyaDialogueId++;
                setTimeout(displayNextMoyamoyaMessage, 1000);
            }
        }
    
        bbsContent.innerText += 'You: ';
        displayNextWord();
    }

    function simulateSystemTakeover() {
        // Clear the screen
        bbsContent.innerHTML = '';
    
        // Create a container for the image and warnings
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.height = '100%';
    
        // Add the image
        const img = document.createElement('img');
        img.src = "assets/entity_ANSCI.png";
        img.alt = "Unknown Entity";
        img.style.width = '100%';
        img.style.maxHeight = '50vh';
        img.style.objectFit = 'contain';
        container.appendChild(img);
    
        // Create a container for warnings
        const warningContainer = document.createElement('div');
        warningContainer.style.overflow = 'auto';
        warningContainer.style.flexGrow = '1';
        warningContainer.style.width = '100%';
        warningContainer.style.padding = '10px';
        warningContainer.style.boxSizing = 'border-box';
        container.appendChild(warningContainer);
    
        bbsContent.appendChild(container);
    
        // Disable input
        inputAllowed = false;
        userInput.style.display = 'none';
        prompt.innerText = '';
    
        // Function to add warnings
        let warningCount = 0;
        function addWarning() {
            if (warningCount < 10) {
                const warning = document.createElement('div');
                warning.textContent = "WARNING: System compromised. Unknown entity detected.";
                warning.style.color = 'red';
                warningContainer.appendChild(warning);
                warningContainer.scrollTop = warningContainer.scrollHeight;
                warningCount++;
                setTimeout(addWarning, 500);
            } else {
                // Add the link after all warnings
                const link = document.createElement('a');
                link.href = "https://moyamoyawinnipeg.bandcamp.com/album/demolition-2024";
                link.target = "_blank";
                link.textContent = "Click here to proceed";
                link.style.display = "block";
                link.style.marginTop = "20px";
                warningContainer.appendChild(link);
            }
        }
    
        // Start adding warnings
        addWarning();
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