require('dotenv').config();
const {
    Client,
    GatewayIntentBits,
    Partials,
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    LabelBuilder,
    TextInputBuilder,
    TextInputStyle,
    REST,
    Routes,
    ChannelType,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');

// ─── Config ───────────────────────────────────────────────────────────────────
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID && process.env.CLIENT_ID !== '0' ? process.env.CLIENT_ID : null;
const GUILD_ID = process.env.GUILD_ID && process.env.GUILD_ID !== '0' ? process.env.GUILD_ID : null;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const NEW_CHANNEL_ID = process.env.NEW_CHANNEL_ID && process.env.NEW_CHANNEL_ID !== '0'
    ? process.env.NEW_CHANNEL_ID : null;
const RISING_CHANNEL_ID = process.env.RISING_CHANNEL_ID && process.env.RISING_CHANNEL_ID !== '0'
    ? process.env.RISING_CHANNEL_ID : null;
const POPULAR_CHANNEL_ID = process.env.POPULAR_CHANNEL_ID && process.env.POPULAR_CHANNEL_ID !== '0'
    ? process.env.POPULAR_CHANNEL_ID : null;
const APPROVED_CHANNEL_ID = process.env.APPROVED_CHANNEL_ID && process.env.APPROVED_CHANNEL_ID !== '0'
    ? process.env.APPROVED_CHANNEL_ID : null;

const VERIFICATION_ROLE_ID = process.env.VERIFICATION_ROLE_ID && process.env.VERIFICATION_ROLE_ID !== '0'
    ? process.env.VERIFICATION_ROLE_ID : null;
const COMMAND_CHANNEL_ID = process.env.COMMAND_CHANNEL_ID && process.env.COMMAND_CHANNEL_ID !== '0'
    ? process.env.COMMAND_CHANNEL_ID : null;
const MIN_ACCOUNT_AGE_DAYS = parseInt(process.env.MIN_ACCOUNT_AGE_DAYS || '7');
const MIN_SERVER_TIME_MINUTES = parseInt(process.env.MIN_SERVER_TIME_MINUTES || '5');
const MAX_SUBMISSIONS_PER_DAY = parseInt(process.env.MAX_SUBMISSIONS_PER_DAY || '5');

const RISING_THRESHOLD = parseInt(process.env.RISING_THRESHOLD || '5');
const POPULAR_THRESHOLD = parseInt(process.env.POPULAR_THRESHOLD || '15');
const ARCHIVE_DAYS = parseInt(process.env.ARCHIVE_DAYS || '14');
const ARCHIVE_MIN_VOTES = parseInt(process.env.ARCHIVE_MIN_VOTES || '3');
const TRENDING_CHANNEL_ID = process.env.TRENDING_CHANNEL_ID && process.env.TRENDING_CHANNEL_ID !== '0'
    ? process.env.TRENDING_CHANNEL_ID : null;
const ARCHIVED_CHANNEL_ID = process.env.ARCHIVED_CHANNEL_ID && process.env.ARCHIVED_CHANNEL_ID !== '0'
    ? process.env.ARCHIVED_CHANNEL_ID : null;

const TAG_NEW = "🆕 New";
const TAG_RISING = "📈 Rising";
const TAG_POPULAR = "🔥 Popular";
const TAG_APPROVED = "✅ Approved";
const TAG_ARCHIVED = "❄️ Archived";

const LANGUAGES = [
    "English", "Spanish (Spain)", "Spanish (Latin America)", "French", "German",
    "Italian", "Portuguese (Brazil)", "Japanese", "Korean", "Chinese (Simplified)",
    "Chinese (Traditional)", "Russian", "Polish", "Turkish", "Thai",
    "Indonesian", "Vietnamese", "Ukrainian", "Czech", "Hungarian",
    "Romanian", "Dutch", "Swedish", "Norwegian", "Danish",
    "Finnish", "Arabic (Modern Standard)", "Hindi", "Catalan", "Galician",
    "Portuguese (Portugal)"
];
const PLATFORMS = ["PC", "Console", "Mobile", "Multiple"];
const STATUSES = ["New", "Rising", "Popular", "Approved", "Archived", "Reviewed", "Contacted", "In Talk", "Funded", "In Loc", "Done", "Rejected"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractSteamAppId(url) {
    const match = (url || '').match(/\/app\/(\d+)/);
    return match ? match[1] : null;
}

function normalizeTitle(title) {
    if (!title) return '';
    const filler = ['the', 'game', 'demo'];
    return title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter(w => !filler.includes(w))
        .join(' ');
}

/** Levenshtein-based similarity 0–100 (mirrors rapidfuzz.ratio) */
function fuzzyRatio(a, b) {
    if (!a && !b) return 100;
    if (!a || !b) return 0;
    const longer = a.length >= b.length ? a : b;
    const shorter = a.length >= b.length ? b : a;
    const matrix = Array.from({ length: shorter.length + 1 }, (_, i) =>
        Array.from({ length: longer.length + 1 }, (_, j) => (i === 0 ? j : i))
    );
    for (let i = 1; i <= shorter.length; i++) {
        for (let j = 1; j <= longer.length; j++) {
            matrix[i][j] = shorter[i - 1] === longer[j - 1]
                ? matrix[i - 1][j - 1]
                : Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + 1);
        }
    }
    return Math.round((1 - matrix[shorter.length][longer.length] / longer.length) * 100);
}

function isGibberish(text) {
    if (!text || text.length < 5) return false;
    const cleaned = text.toLowerCase().replace(/\s/g, '');
    if (new Set(cleaned).size < 3 && text.length > 10) return true;
    if (text.split(/\s+/).some(w => w.length > 25)) return true;
    if (/[asdfghjkl]{6,}/i.test(text) || /[qwertyuiop]{6,}/i.test(text)) return true;
    return false;
}

function parsePrice(str) {
    const clean = String(str || '').replace(/[^\d.]/g, '');
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
}

// ─── Modal Builders ────────────────────────────────────────────────────────────
// NOTE: Discord does NOT allow responding to a modal submit with another modal.
// The two-step submission uses:
//   Step 1 modal → reply with "Continue" button → button shows Step 2 modal.

/** Submission Form 1: Platform, Language, Game Title, Store Link, Owned */
function buildSubmissionModal1() {
    const modal = new ModalBuilder()
        .setCustomId('submission_part1')
        .setTitle('Submit for Localization (1/2)');

    const languageSelect = new StringSelectMenuBuilder()
        .setCustomId('language')
        .setPlaceholder('Select Language')
        .setRequired(true)
        .addOptions(LANGUAGES.slice(0, 25).map(l => new StringSelectMenuOptionBuilder().setLabel(l).setValue(l)));

    const ownedSelect = new StringSelectMenuBuilder()
        .setCustomId('owned')
        .setPlaceholder('Do you already own this game?')
        .setRequired(true)
        .addOptions([
            new StringSelectMenuOptionBuilder().setLabel('Yes, I own it').setValue('Yes'),
            new StringSelectMenuOptionBuilder().setLabel("No, I don't own it").setValue('No')
        ]);

    const titleInput = new TextInputBuilder()
        .setCustomId('game_title')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter the game name')
        .setRequired(true)
        .setMaxLength(200);

    const linkInput = new TextInputBuilder()
        .setCustomId('store_link')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://store.steampowered.com/app/...')
        .setRequired(true)
        .setMaxLength(500);

    modal.addLabelComponents(
        new LabelBuilder().setLabel('Language').setDescription('Which language would you want this game localized into? (One vote per game.)').setStringSelectMenuComponent(languageSelect),
        new LabelBuilder().setLabel('Game Title').setDescription('Name of the game.').setTextInputComponent(titleInput),
        new LabelBuilder().setLabel('Store Link (Steam Only)').setDescription('Link to the official Steam store page.').setTextInputComponent(linkInput),
        new LabelBuilder().setLabel('Do you own the game?').setDescription('Do you already own this game?').setStringSelectMenuComponent(ownedSelect)
    );
    return modal;
}

/** Submission Form 2: Price + Reason (shown after clicking Continue button) */
function buildSubmissionModal2(owned) {
    const modal = new ModalBuilder()
        .setCustomId('submission_part2')
        .setTitle('Submit for Localization (2/2)');

    const pricePrompt = 'Estimated Contribution if Crowdfunded ($)';

    const priceInput = new TextInputBuilder()
        .setCustomId('price')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 15, 20.50')
        .setRequired(true)
        .setMaxLength(20);

    const disclaimerInput = new TextInputBuilder()
        .setCustomId('disclaimer')
        .setStyle(TextInputStyle.Paragraph)
        .setValue('This is not a payment and does not obligate you. It helps us evaluate whether a localization project would be financially feasible before approaching the developer or launching a crowdfunding campaign.')
        .setRequired(false)
        .setMaxLength(500);

    modal.addLabelComponents(
        new LabelBuilder().setLabel(pricePrompt).setDescription('How much would you realistically contribute or pay for a localized version?').setTextInputComponent(priceInput),
        new LabelBuilder().setLabel('⚠️ Important Note').setDescription('Please read before submitting.').setTextInputComponent(disclaimerInput)
    );
    return modal;
}

/**
 * Vote Modal: Language + Owned + Price in a single modal.
 * Votes fit in one modal (3 fields), so no chaining is needed.
 * gameId is encoded in customId so it survives the submit.
 */
function buildVoteModal(gameId) {
    const modal = new ModalBuilder()
        .setCustomId(`vote_modal_${gameId}`)
        .setTitle('Vote for This Game');

    const languageSelect = new StringSelectMenuBuilder()
        .setCustomId('vote_language')
        .setPlaceholder('Select Language')
        .setRequired(true)
        .addOptions(LANGUAGES.slice(0, 25).map(l => new StringSelectMenuOptionBuilder().setLabel(l).setValue(l)));

    const ownedSelect = new StringSelectMenuBuilder()
        .setCustomId('vote_owned')
        .setPlaceholder('Do you already own this game?')
        .setRequired(true)
        .addOptions([
            new StringSelectMenuOptionBuilder().setLabel('Yes, I own it').setValue('Yes'),
            new StringSelectMenuOptionBuilder().setLabel("No, I don't own it").setValue('No')
        ]);

    const priceInput = new TextInputBuilder()
        .setCustomId('vote_price')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 15, 20.50')
        .setRequired(true)
        .setMaxLength(20);

    const disclaimerInput = new TextInputBuilder()
        .setCustomId('vote_disclaimer')
        .setStyle(TextInputStyle.Paragraph)
        .setValue('This is not a payment and does not obligate you. It helps us evaluate whether a localization project would be financially feasible before approaching the developer or launching a crowdfunding campaign.')
        .setRequired(false)
        .setMaxLength(500);

    modal.addLabelComponents(
        new LabelBuilder().setLabel('Language').setDescription('Which language would you want this game localized into? (One vote per game.)').setStringSelectMenuComponent(languageSelect),
        new LabelBuilder().setLabel('Do you own the game?').setDescription('Do you already own this game?').setStringSelectMenuComponent(ownedSelect),
        new LabelBuilder().setLabel('Estimated Contribution if Crowdfunded ($)').setDescription('How much would you realistically contribute or pay for a localized version?').setTextInputComponent(priceInput),
        new LabelBuilder().setLabel('⚠️ Important Note').setDescription('Please read before submitting.').setTextInputComponent(disclaimerInput)
    );
    return modal;
}

// ─── Bot Class ─────────────────────────────────────────────────────────────────
class LocalizationBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ],
            partials: [Partials.Channel, Partials.GuildMember]
        });

        // Cache entries include _row reference for in-place sheet updates
        this.gamesCache = [];
        this.votesCache = [];
        this.submissionTracker = new Map();
        this.blacklist = new Set();
        this.blacklistFile = path.join(__dirname, 'blacklist.json');

        // Stores submission part-1 data while user clicks the Continue button
        // Map<userId, { platform, language, owned, gameTitle, storeLink }>
        this.pendingSubmissions = new Map();

        this.loadBlacklist();
        this.setupEvents();
    }

    // ── Blacklist ───────────────────────────────────────────────────────────────
    loadBlacklist() {
        try {
            if (fs.existsSync(this.blacklistFile)) {
                const data = JSON.parse(fs.readFileSync(this.blacklistFile, 'utf8'));
                this.blacklist = new Set((data.blacklisted_users || []).map(String));
                console.log(`✅ Loaded ${this.blacklist.size} blacklisted users`);
            }
        } catch (e) {
            console.error(`⚠️ Could not load blacklist: ${e.message}`);
        }
    }

    saveBlacklist() {
        try {
            fs.writeFileSync(this.blacklistFile, JSON.stringify({ blacklisted_users: [...this.blacklist] }));
            console.log(`✅ Saved blacklist (${this.blacklist.size} users)`);
        } catch (e) {
            console.error(`❌ Error saving blacklist: ${e.message}`);
        }
    }

    // ── Google Sheets ───────────────────────────────────────────────────────────
    async setupSheets() {
        let creds;

        if (process.env.GOOGLE_CREDENTIALS_JSON) {
            creds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        } else {
            const credsFile = process.env.CREDENTIALS_FILE || './credentials.json';
            creds = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
        }

        const auth = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
        await this.doc.loadInfo();

        this.gamesSheet = this.doc.sheetsByTitle['Games_Master'];
        if (!this.gamesSheet) {
            this.gamesSheet = await this.doc.addSheet({
                title: 'Games_Master',
                headerValues: [
                    "Game_ID", "Canonical_Title", "Original_Submitted_Title", "Store_Link",
                    "Steam_AppID", "Platform", "Requested_Languages", "Total_Votes",
                    "First_Submitted_Timestamp_UTC", "Last_Vote_Timestamp_UTC", "Status", "Notes",
                    "Total_Owned_Yes", "Total_Owned_No", "Total_Willing_Pay_Count", "Total_Willing_Pay_Sum",
                    "Thread_ID"
                ]
            });
            console.log('✅ Created Games_Master sheet');
        }

        this.votesSheet = this.doc.sheetsByTitle['Votes_Log'];
        if (!this.votesSheet) {
            this.votesSheet = await this.doc.addSheet({
                title: 'Votes_Log',
                headerValues: [
                    "Timestamp_UTC", "Discord_User", "Discord_User_ID", "Game_ID",
                    "Language", "Action", "Owned", "Willing_Pay"
                ]
            });
            console.log('✅ Created Votes_Log sheet');
        }

        await this.refreshCache();
        console.log(`✅ Google Sheets connected! ${this.gamesCache.length} games, ${this.votesCache.length} votes`);
    }

    _gameFromRow(r) {
        return {
            _row: r,
            Game_ID: r.get('Game_ID'),
            Canonical_Title: r.get('Canonical_Title'),
            Original_Submitted_Title: r.get('Original_Submitted_Title'),
            Store_Link: r.get('Store_Link'),
            Steam_AppID: r.get('Steam_AppID'),
            Platform: r.get('Platform'),
            Requested_Languages: r.get('Requested_Languages'),
            Total_Votes: parseInt(r.get('Total_Votes') || 0),
            First_Submitted_Timestamp_UTC: r.get('First_Submitted_Timestamp_UTC'),
            Last_Vote_Timestamp_UTC: r.get('Last_Vote_Timestamp_UTC'),
            Status: r.get('Status'),
            Notes: r.get('Notes'),
            Total_Owned_Yes: parseInt(r.get('Total_Owned_Yes') || 0),
            Total_Owned_No: parseInt(r.get('Total_Owned_No') || 0),
            Total_Willing_Pay_Count: parseInt(r.get('Total_Willing_Pay_Count') || 0),
            Total_Willing_Pay_Sum: parseFloat(r.get('Total_Willing_Pay_Sum') || 0),
            Thread_ID: r.get('Thread_ID'),
        };
    }

    _voteFromRow(r) {
        return {
            _row: r,
            Timestamp_UTC: r.get('Timestamp_UTC'),
            Discord_User: r.get('Discord_User'),
            Discord_User_ID: r.get('Discord_User_ID'),
            Game_ID: r.get('Game_ID'),
            Language: r.get('Language'),
            Action: r.get('Action'),
            Owned: r.get('Owned'),
            Willing_Pay: r.get('Willing_Pay'),
        };
    }

    async refreshCache() {
        try {
            const gameRows = await this.gamesSheet.getRows();
            this.gamesCache = gameRows.map(r => this._gameFromRow(r));

            const voteRows = await this.votesSheet.getRows();
            this.votesCache = voteRows.map(r => this._voteFromRow(r));

            // Check if any headers need to be added to existing sheet
            if (this.gamesCache.length > 0 && !this.gamesSheet.headerValues.includes('Thread_ID')) {
                console.log("⚠️ Adding Thread_ID column to sheet headers...");
                await this.gamesSheet.setHeaderRow([
                    "Game_ID", "Canonical_Title", "Original_Submitted_Title", "Store_Link",
                    "Steam_AppID", "Platform", "Requested_Languages", "Total_Votes",
                    "First_Submitted_Timestamp_UTC", "Last_Vote_Timestamp_UTC", "Status", "Notes",
                    "Total_Owned_Yes", "Total_Owned_No", "Total_Willing_Pay_Count", "Total_Willing_Pay_Sum",
                    "Thread_ID"
                ]);
            }

            console.log(`✅ Cache refreshed: ${this.gamesCache.length} games, ${this.votesCache.length} votes`);
        } catch (e) {
            console.error(`❌ Error refreshing cache: ${e.message}`);
        }
    }

    // ── Steam API ───────────────────────────────────────────────────────────────
    async fetchSteamGameDetails(appId) {
        if (!appId) return null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const res = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`, { timeout: 5000 });
                const entry = res.data[String(appId)];
                if (entry?.success) {
                    return {
                        name: entry.data.name || null,
                        description: entry.data.short_description || null,
                        image: entry.data.header_image || null,
                    };
                }
                break; // If entry.success is false, Steam says the ID is invalid, so don't retry
            } catch (e) {
                if (attempt === 3) {
                    console.warn(`⚠️ Steam fetch error (Final attempt) for ${appId}: ${e.message}`);
                } else {
                    console.log(`   🔄 Steam fetch attempt ${attempt} failed, retrying in 1s...`);
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
        return null;
    }

    // ── Duplicate Detection ─────────────────────────────────────────────────────
    findDuplicateGame(title, storeLink) {
        const appId = extractSteamAppId(storeLink);
        const normTitle = normalizeTitle(title);
        for (const game of this.gamesCache) {
            if (appId && String(game.Steam_AppID) === appId) return game;
            if (game.Store_Link === storeLink) return game;
            if (fuzzyRatio(normTitle, normalizeTitle(game.Canonical_Title)) > 85) return game;
        }
        return null;
    }

    checkDuplicateVote(userId, gameId, language) {
        return this.votesCache.some(v =>
            String(v.Discord_User_ID) === String(userId) &&
            String(v.Game_ID) === String(gameId) &&
            v.Language === language
        );
    }

    // ── Anti-Spam ───────────────────────────────────────────────────────────────
    async antiSpamCheck(user, guild, skipDailyLimit = false) {
        if (this.blacklist.has(String(user.id)))
            return { allowed: false, reason: "You are blacklisted from submissions." };

        const ageDays = (Date.now() - user.createdTimestamp) / 86400000;
        if (ageDays < MIN_ACCOUNT_AGE_DAYS)
            return { allowed: false, reason: `Your Discord account must be at least ${MIN_ACCOUNT_AGE_DAYS} days old.` };

        const member = guild.members.cache.get(user.id) ||
            await guild.members.fetch(user.id).catch(() => null);
        if (member?.joinedTimestamp) {
            const serverMins = (Date.now() - member.joinedTimestamp) / 60000;
            if (serverMins < MIN_SERVER_TIME_MINUTES)
                return { allowed: false, reason: `You must be in the server for at least ${MIN_SERVER_TIME_MINUTES} minutes.` };

            if (VERIFICATION_ROLE_ID) {
                const role = guild.roles.cache.get(VERIFICATION_ROLE_ID);
                if (role && !member.roles.cache.has(VERIFICATION_ROLE_ID))
                    return { allowed: false, reason: `You need the **${role.name}** role to submit games.` };
            }
        }

        if (!skipDailyLimit) {
            const key = `${user.id}_${new Date().toISOString().split('T')[0]}`;
            const count = this.submissionTracker.get(key) || 0;
            if (count >= MAX_SUBMISSIONS_PER_DAY)
                return { allowed: false, reason: `You've reached the maximum of ${MAX_SUBMISSIONS_PER_DAY} brand-new submissions per day. You can still vote on existing games!` };
        }

        return { allowed: true };
    }

    incrementSubmissionCount(userId) {
        const key = `${userId}_${new Date().toISOString().split('T')[0]}`;
        this.submissionTracker.set(key, (this.submissionTracker.get(key) || 0) + 1);
    }

    // ── Core Logic ──────────────────────────────────────────────────────────────
    async processSubmission(user, gameTitle, storeLink, platform, language, reason, owned, price, guild) {
        console.log(`\n📝 Processing submission from ${user.username}: ${gameTitle}`);

        const appId = extractSteamAppId(storeLink);
        let steamDetails = null;
        if (appId) {
            steamDetails = await this.fetchSteamGameDetails(appId);
            if (steamDetails?.name) {
                console.log(`   ✓ Steam title: ${gameTitle} → ${steamDetails.name}`);
                gameTitle = steamDetails.name;
            }
        }

        const duplicate = this.findDuplicateGame(gameTitle, storeLink);
        if (duplicate) {
            if (this.checkDuplicateVote(user.id, duplicate.Game_ID, language))
                return { message: `❌ You already voted for **${duplicate.Canonical_Title}** in **${language}**. Try a different language or a different game!` };
            await this.addVoteToExistingGame(user, duplicate, language, owned, price);
            // After successful vote via form, move the setup button to bottom
            await this._refreshSubmitButton(guild);
            // DO NOT increment submission count for duplicates - it's just a vote
            return { message: `✅ Vote recorded for **${duplicate.Canonical_Title}**! (This game was already submitted by another player).` };
        }

        // Only check daily limit here - when we KNOW it is a brand-new game
        const key = `${user.id}_${new Date().toISOString().split('T')[0]}`;
        const count = this.submissionTracker.get(key) || 0;
        if (count >= MAX_SUBMISSIONS_PER_DAY) {
            return { message: `❌ You've reached the maximum of ${MAX_SUBMISSIONS_PER_DAY} brand-new submissions per day. You can still vote on existing games!` };
        }

        const gameId = await this.createNewGame(user, gameTitle, storeLink, platform, language, reason, owned, price);
        this.incrementSubmissionCount(user.id);
        await this.postToGameChannel(guild, gameId, gameTitle, storeLink, platform, language, reason, steamDetails?.description, steamDetails?.image);

        // After successful submission, move the setup button to bottom
        await this._refreshSubmitButton(guild);

        return { message: `✅ **${gameTitle}** submitted successfully! Thank you for your submission.` };
    }

    async createNewGame(user, title, link, platform, language, reason, owned, price) {
        let maxId = 0;
        for (const g of this.gamesCache) {
            const gid = g.Game_ID || '';
            if (gid.startsWith('GAME_')) {
                const num = parseInt(gid.split('_')[1]);
                if (!isNaN(num) && num > maxId) maxId = num;
            }
        }

        const gameId = `GAME_${String(maxId + 1).padStart(5, '0')}`;
        const timestamp = new Date().toISOString();
        const priceVal = parsePrice(price);
        const isOwned = ['yes', 'y', 'true', '1'].includes((owned || '').trim().toLowerCase());

        const rowData = {
            Game_ID: gameId,
            Canonical_Title: title.trim(),
            Original_Submitted_Title: title.trim(),
            Store_Link: link,
            Steam_AppID: extractSteamAppId(link) || '',
            Platform: platform,
            Requested_Languages: language,
            Total_Votes: 1,
            First_Submitted_Timestamp_UTC: timestamp,
            Last_Vote_Timestamp_UTC: timestamp,
            Status: "New",
            Notes: reason || "",
            Total_Owned_Yes: isOwned ? 1 : 0,
            Total_Owned_No: isOwned ? 0 : 1,
            Total_Willing_Pay_Count: priceVal > 0 ? 1 : 0,
            Total_Willing_Pay_Sum: priceVal,
            Thread_ID: '',
        };

        const voteData = {
            Timestamp_UTC: timestamp,
            Discord_User: user.username,
            Discord_User_ID: String(user.id),
            Game_ID: gameId,
            Language: language,
            Action: "Submit",
            Owned: isOwned ? "Yes" : "No",
            Willing_Pay: priceVal,
        };

        // Parallelize adding both rows to maximize speed
        const [addedGameRow, addedVoteRow] = await Promise.all([
            this.gamesSheet.addRow(rowData),
            this.votesSheet.addRow(voteData)
        ]);
        console.log(`   ✓ Added to Games_Master and Votes_Log: ${gameId}`);

        this.gamesCache.push({ _row: addedGameRow, ...rowData });
        this.votesCache.push({ _row: addedVoteRow, ...voteData });

        return gameId;
    }

    async addVoteToExistingGame(user, game, language, owned, price) {
        const row = game._row;
        const isOwned = ['yes', 'y', 'true', '1'].includes((owned || '').trim().toLowerCase());
        const priceVal = parsePrice(price);
        const timestamp = new Date().toISOString();

        const newVotes = (game.Total_Votes || 0) + 1;
        row.set('Total_Votes', newVotes);
        game.Total_Votes = newVotes;

        const langs = (game.Requested_Languages || '').split('|').map(l => l.trim()).filter(Boolean);
        if (!langs.includes(language)) {
            langs.push(language);
            row.set('Requested_Languages', langs.join('|'));
            game.Requested_Languages = langs.join('|');
        }

        if (isOwned) {
            row.set('Total_Owned_Yes', (game.Total_Owned_Yes || 0) + 1);
            game.Total_Owned_Yes = (game.Total_Owned_Yes || 0) + 1;
        } else {
            row.set('Total_Owned_No', (game.Total_Owned_No || 0) + 1);
            game.Total_Owned_No = (game.Total_Owned_No || 0) + 1;
        }

        if (priceVal > 0) {
            row.set('Total_Willing_Pay_Count', (game.Total_Willing_Pay_Count || 0) + 1);
            row.set('Total_Willing_Pay_Sum', (game.Total_Willing_Pay_Sum || 0) + priceVal);
            game.Total_Willing_Pay_Count = (game.Total_Willing_Pay_Count || 0) + 1;
            game.Total_Willing_Pay_Sum = (game.Total_Willing_Pay_Sum || 0) + priceVal;
        }

        row.set('Last_Vote_Timestamp_UTC', timestamp);
        game.Last_Vote_Timestamp_UTC = timestamp;

        const voteData = {
            Timestamp_UTC: timestamp,
            Discord_User: user.username,
            Discord_User_ID: String(user.id),
            Game_ID: game.Game_ID,
            Language: language,
            Action: "Vote",
            Owned: isOwned ? "Yes" : "No",
            Willing_Pay: priceVal,
        };

        // Parallelize Sheets update, vote logging, and momentum check
        await Promise.all([
            row.save(),
            this.votesSheet.addRow(voteData).then(addedVoteRow => {
                this.votesCache.push({ _row: addedVoteRow, ...voteData });
            }),
            this.updateGameMomentum(game.Game_ID, newVotes)
        ]);

        console.log(`   ✓ Vote processed and logged: ${game.Game_ID}`);
    }

    async processVote(user, gameId, language, owned, price) {
        const game = this.gamesCache.find(g => g.Game_ID === gameId);
        if (!game) return { message: "❌ Game not found." };

        if (this.checkDuplicateVote(user.id, gameId, language))
            return { message: `❌ You already voted for **${game.Canonical_Title}** in **${language}**. Try a different language!` };

        await this.addVoteToExistingGame(user, game, language, owned, price);

        // Refresh floating button in the thread if it exists
        if (game.Thread_ID) {
            for (const guild of this.client.guilds.cache.values()) {
                const thread = await guild.channels.fetch(game.Thread_ID).catch(() => null);
                if (thread && thread.isThread()) {
                    await this._refreshFloatingVoteButton(thread).catch(() => { });
                    break;
                }
            }
        }

        return { message: `✅ Vote recorded for **${game.Canonical_Title}**! Thank you for your submission.` };
    }

    async updateGameMomentum(gameId, totalVotes) {
        let newStatus = null;

        if (totalVotes >= POPULAR_THRESHOLD) {
            newStatus = "Popular";
        } else if (totalVotes >= RISING_THRESHOLD) {
            newStatus = "Rising";
        } else {
            return;
        }

        const game = this.gamesCache.find(g => g.Game_ID === gameId);
        if (!game) return;

        const currentStatus = game.Status || 'New';
        const rank = { 'New': 0, 'Archived': 0, 'Rising': 1, 'Popular': 2, 'Approved': 3, 'Reviewed': 3, 'Contacted': 4, 'In Talk': 5, 'Funded': 6, 'In Loc': 7, 'Done': 8 };
        if ((rank[currentStatus] || 0) >= (rank[newStatus] || 0)) return;

        try {
            console.log(`   📊 Momentum: ${game.Canonical_Title} ${currentStatus} → ${newStatus}`);

            if (currentStatus === 'Archived') {
                console.log(`   🌟 Resurrection! ${game.Canonical_Title} is back from the archive!`);
            }

            // Update status in sheet
            game._row.set('Status', newStatus);
            await game._row.save();
            game.Status = newStatus;

            // Edit thread embed in-place in NEW_CHANNEL_ID
            if (NEW_CHANNEL_ID && game.Thread_ID) {
                for (const guild of this.client.guilds.cache.values()) {
                    try {
                        const channel = guild.channels.cache.get(NEW_CHANNEL_ID) ||
                            await guild.channels.fetch(NEW_CHANNEL_ID).catch(() => null);
                        if (!channel) continue;

                        const thread = await guild.channels.fetch(game.Thread_ID).catch(() => null);
                        if (!thread) continue;

                        const emojiMap = { 'New': '🆕', 'Rising': '📈', 'Popular': '🔥', 'Approved': '✅', 'Archived': '❄️' };
                        const statusEmoji = emojiMap[newStatus] || '🎮';
                        const colorMap = { 'Popular': 0xFF4500, 'Rising': 0xFFAA00 };
                        const embedColor = colorMap[newStatus] || 0x0099FF;

                        const starter = await thread.fetchStarterMessage().catch(() => null);
                        if (starter) {
                            const oldEmbed = starter.embeds[0];
                            const updatedEmbed = new EmbedBuilder()
                                .setTitle(`${statusEmoji} ${game.Canonical_Title}`)
                                .setDescription(oldEmbed?.description || "Support this game's localization!")
                                .setColor(embedColor)
                                .setFooter({ text: "The more votes, the higher the chance of localization!" });

                            if (oldEmbed?.thumbnail?.url) updatedEmbed.setThumbnail(oldEmbed.thumbnail.url);
                            if (oldEmbed?.fields) updatedEmbed.addFields(oldEmbed.fields);

                            const row = new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`persistent_vote_button_${game.Game_ID}`)
                                    .setLabel('🗳️ Vote for This Game')
                                    .setStyle(ButtonStyle.Primary)
                            );

                            await starter.edit({ embeds: [updatedEmbed], components: [row] }).catch(() => { });
                            await thread.setName(`${statusEmoji} ${game.Canonical_Title}`.substring(0, 100)).catch(() => { });
                        }

                        await this._ensureAndApplyTags(channel, thread, game);
                        break;
                    } catch (innerErr) {
                        console.warn(`   ⚠️ Could not update thread for ${gameId} in guild ${guild.name}: ${innerErr.message}`);
                    }
                }
            }

            // Update dashboard in all guilds
            for (const guild of this.client.guilds.cache.values()) {
                await this.updateDashboard(guild).catch(() => { });
            }

        } catch (e) {
            console.error(`   ⚠️ Error updating momentum for ${gameId}: ${e.message}`);
        }
    }




    async _refreshSubmitButton(guild) {
        if (!COMMAND_CHANNEL_ID) return;
        try {
            const channel = await guild.channels.fetch(COMMAND_CHANNEL_ID).catch(() => null);
            if (!channel || !channel.isTextBased()) return;

            // 1. Find and delete ANY old button messages in the last 50 to keep it clean
            const msgs = await channel.messages.fetch({ limit: 50 }).catch(() => null);
            if (msgs) {
                const oldMsg = msgs.find(m => m.author.id === this.client.user.id && m.components.some(c => c.components.some(b => b.customId === 'persistent_submit_button')));
                if (oldMsg) await oldMsg.delete().catch(() => { });
            }

            // 2. Post new setup message at the bottom silently (no notification ping)
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('persistent_submit_button').setLabel('📝 Submit a Game').setStyle(ButtonStyle.Success)
            );

            await channel.send({
                content: "**Click the button below to submit a game for localization!** 👇",
                components: [row],
                flags: [MessageFlags.SuppressNotifications] // Sends without pinging or unreading for users
            });
        } catch (e) {
            console.error(`   ⚠️ Error refreshing submit button: ${e.message}`);
        }
    }

    async syncAllGameStatuses(guild) {
        if (!guild) return 0;
        await this.refreshCache(); // Ensure we have latest sheet data
        let synced = 0;

        const channelMap = {
            'New': NEW_CHANNEL_ID,
            'Rising': RISING_CHANNEL_ID,
            'Popular': POPULAR_CHANNEL_ID,
            'Approved': APPROVED_CHANNEL_ID
        };

        for (const game of this.gamesCache) {
            const status = game.Status || 'New';

            // Auto-Tier Re-evaluation
            let currentStatus = status;
            if (['New', 'Rising', 'Popular'].includes(currentStatus)) {
                if (game.Total_Votes >= POPULAR_THRESHOLD) currentStatus = 'Popular';
                else if (game.Total_Votes >= RISING_THRESHOLD) currentStatus = 'Rising';
                else currentStatus = 'New';
            }

            const targetChannelId = channelMap[currentStatus];
            if (!targetChannelId) continue;

            // PREVENT MULTI-GUILD LOOP: Only sync if this guild actually owns the target channel
            const targetChannel = await guild.channels.fetch(targetChannelId).catch(() => null);
            if (!targetChannel) continue;

            try {
                let moveNeeded = true;
                let renameNeeded = false;
                if (game.Thread_ID) {
                    // 1. Try treating it as a channel/thread
                    let currentPost = await guild.channels.fetch(game.Thread_ID).catch(() => null);
                    
                    // 2. If not found, and it's a text channel, try treating it as a message
                    if (!currentPost && targetChannel.isTextBased()) {
                        currentPost = await targetChannel.messages.fetch(game.Thread_ID).catch(() => null);
                    }

                    if (currentPost) {
                        const currentParentId = currentPost.parentId || currentPost.channelId || currentPost.id;
                        if (currentParentId === targetChannelId) {
                            moveNeeded = false;
                            
                            // If it's a thread, check if it needs renaming (legacy name cleanup)
                            if (currentPost.name && currentPost.name.includes('(GAME_')) {
                                renameNeeded = true;
                            }
                        }
                    }
                }
                // ALWAYS run a cleanup sweep to ensure no "ghosts" exist in other channels
                // We pass the current targetChannelId as an 'exemption' so it doesn't delete the correct one
                await this._deleteOldPost(game, targetChannelId);

                if (moveNeeded || renameNeeded) {
                    if (moveNeeded) console.log(`   🔄 Syncing ${game.Canonical_Title} to ${currentStatus}...`);
                    else console.log(`   🏷️ Cleaning up title for ${game.Canonical_Title}...`);

                    // NEW: Capture chat history before we potentially delete/move
                    const chatHistory = await this._getChatHistory(game);

                    // Update status in sheet if it changed
                    if (game.Status !== currentStatus) {
                        game._row.set('Status', currentStatus);
                        await game._row.save();
                        game.Status = currentStatus;
                    }

                    const appId = extractSteamAppId(game.Store_Link);
                    let description = null, image = null;
                    if (appId) {
                        const details = await this.fetchSteamGameDetails(appId);
                        description = details?.description;
                        image = details?.image;
                    }
                    await this.postToGameChannel(guild, game.Game_ID, game.Canonical_Title, game.Store_Link, game.Platform, game.Requested_Languages.split('|')[0], (game.Notes || ""), description, image, targetChannelId, chatHistory);
                    synced++;
                }
            } catch (err) {
                console.error(`❌ Failed to sync ${game.Game_ID}:`, err.message);
            }
        }
        return synced;
    }

    async _refreshFloatingVoteButton(thread) {
        if (!thread || !thread.isThread()) return;

        const game = this.gamesCache.find(g => g.Thread_ID === thread.id);
        if (!game) return;

        try {
            // Fetch the last 10 messages to see if our button is still "visible" enough
            const msgs = await thread.messages.fetch({ limit: 10 }).catch(() => null);
            if (msgs) {
                // If the button is already anywhere in the last 10 messages, don't move it yet (avoid spam)
                const isStillVisible = msgs.some(m =>
                    m.author.id === this.client.user.id &&
                    m.components.length > 0 &&
                    m.components[0].components.some(c => c.customId === `persistent_vote_button_${game.Game_ID}`)
                );

                if (isStillVisible) return;

                // If not visible, delete any old ones (except the very first thread message)
                const olderMsgs = await thread.messages.fetch({ limit: 50 }).catch(() => null);
                if (olderMsgs) {
                    const botFloatingMessages = olderMsgs.filter(m =>
                        m.author.id === this.client.user.id &&
                        m.components.length > 0 &&
                        m.components[0].components.some(c => c.customId === `persistent_vote_button_${game.Game_ID}`) &&
                        m.id !== thread.id
                    );
                    for (const msg of botFloatingMessages.values()) {
                        await msg.delete().catch(() => { });
                    }
                }
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`persistent_vote_button_${game.Game_ID}`)
                    .setLabel('🗳️ Vote for This Game')
                    .setStyle(ButtonStyle.Primary)
            );

            await thread.send({
                content: "🗳️ **Want to see this game localized?** Click the button below to vote!",
                components: [row]
            });
        } catch (e) { }
    }

    async _getChatHistory(game) {
        if (!game.Thread_ID) return [];
        try {
            for (const guild of this.client.guilds.cache.values()) {
                const thread = await guild.channels.fetch(game.Thread_ID).catch(() => null);
                if (thread && thread.isThread()) {
                    const messages = await thread.messages.fetch({ limit: 50 }).catch(() => null);
                    if (!messages) return [];

                    // Filter for user messages only (not bot, not system)
                    return messages
                        .filter(m => !m.author.bot && m.content && m.content.length > 0)
                        .map(m => `**${m.author.username}**: ${m.content}`)
                        .reverse(); // Newest last
                }
            }
        } catch (e) { }
        return [];
    }

    async _deleteOldPost(game, excludeChannelId = null) {
        if (!game) return;
        const gid = game.Game_ID;
        const title = game.Canonical_Title;
        const managedChannels = [NEW_CHANNEL_ID, RISING_CHANNEL_ID, POPULAR_CHANNEL_ID, APPROVED_CHANNEL_ID, ARCHIVED_CHANNEL_ID];

        try {
            for (const guild of this.client.guilds.cache.values()) {
                for (const cid of managedChannels) {
                    if (!cid || cid === excludeChannelId) continue; // Skip the channel where the game SHOULD be

                    const channel = await guild.channels.fetch(cid).catch(() => null);
                    if (!channel) continue;

                    if (channel.type === ChannelType.GuildForum) {
                        // Check ACTIVE threads in the "wrong" channel
                        const active = await channel.threads.fetchActive().catch(() => ({ threads: new Map() }));
                        const activeStrays = active.threads.filter(t => (t.name === title || t.name.includes(` ${title}`) || t.name.includes(gid)));

                        // Build list of stray threads: start from active matches, then also check by exact Thread_ID
                        const allStrays = [...activeStrays.values()];

                        // Directly fetch by Thread_ID to find sleeping archived threads (avoids fetchArchived 50-item pagination limit)
                        if (game.Thread_ID) {
                            const specificThread = await channel.threads.fetch(game.Thread_ID).catch(() => null);
                            if (specificThread && specificThread.parentId === cid && !allStrays.some(t => t.id === specificThread.id)) {
                                allStrays.push(specificThread);
                            }
                        }

                        for (const stray of allStrays) {
                            await stray.delete().catch(() => { });
                            console.log(`   🗑️ Cleaned up stray thread in ${channel.name}: ${stray.name}`);
                        }
                    } else if (channel.isTextBased()) {
                        // For text channels, we try to delete the specific ID if it's pointing here incorrectly
                        if (game.Thread_ID) {
                            const msg = await channel.messages.fetch(game.Thread_ID).catch(() => null);
                            if (msg && msg.channelId === cid) {
                                await msg.delete().catch(() => { });
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.warn(`   ⚠️ Warning: Deep cleanup for ${gid} encountered issues: ${e.message}`);
        }
    }
    // ── Tag Management ──────────────────────────────────────────────────────────
    async _ensureAndApplyTags(channel, thread, game) {
        if (!channel || channel.type !== ChannelType.GuildForum) return;
        try {
            // Build list of desired tag names (status + languages), capped at 5
            const statusName = game.Status || 'New';
            const langs = (game.Requested_Languages || '').split('|').map(l => l.trim()).filter(Boolean);
            const desiredNames = [statusName, ...langs].slice(0, 5);

            // Ensure all desired tags exist on the channel (max 20 total)
            let existingTags = [...(channel.availableTags || [])];
            const existingNames = new Set(existingTags.map(t => t.name));
            const toCreate = desiredNames.filter(n => !existingNames.has(n));

            if (toCreate.length > 0) {
                const canCreate = Math.max(0, 20 - existingTags.length);
                const creating = toCreate.slice(0, canCreate);
                if (creating.length > 0) {
                    const updated = await channel.setAvailableTags([
                        ...existingTags,
                        ...creating.map(name => ({ name }))
                    ]).catch(() => null);
                    if (updated) existingTags = [...(updated.availableTags || [])];
                }
            }

            // Resolve tag IDs for the desired names
            const tagIds = desiredNames
                .map(name => existingTags.find(t => t.name === name)?.id)
                .filter(Boolean)
                .slice(0, 5);

            if (tagIds.length > 0 && thread?.setAppliedTags) {
                await thread.setAppliedTags(tagIds).catch(() => { });
            }
        } catch (e) {
            console.warn(`   ⚠️ Tag operation failed for ${game?.Game_ID}: ${e.message}`);
        }
    }

    // ── Dashboard ───────────────────────────────────────────────────────────────
    async updateDashboard(guild) {
        if (!NEW_CHANNEL_ID) return null;
        try {
            const channel = guild.channels.cache.get(NEW_CHANNEL_ID) ||
                await guild.channels.fetch(NEW_CHANNEL_ID).catch(() => null);
            if (!channel || channel.type !== ChannelType.GuildForum) return null;

            const DASHBOARD_NAME = '📊 Loca Rankings';
            const now = Date.now();
            const weekAgo = now - (7 * 86400000);

            // Build embed sections
            const excludedStatuses = ['Archived', 'Done', 'Rejected'];

            // Popular section
            const popularGames = this.gamesCache
                .filter(g => (g.Total_Votes || 0) >= POPULAR_THRESHOLD && !excludedStatuses.includes(g.Status))
                .sort((a, b) => b.Total_Votes - a.Total_Votes)
                .slice(0, 10);

            // Rising section
            const risingGames = this.gamesCache
                .filter(g => (g.Total_Votes || 0) >= RISING_THRESHOLD && (g.Total_Votes || 0) < POPULAR_THRESHOLD && !excludedStatuses.includes(g.Status))
                .sort((a, b) => b.Total_Votes - a.Total_Votes)
                .slice(0, 10);

            // Trending this week (from votesCache)
            const weeklyVotesMap = new Map();
            for (const v of this.votesCache) {
                const vts = new Date(v.Timestamp_UTC).getTime();
                if (vts >= weekAgo) {
                    weeklyVotesMap.set(v.Game_ID, (weeklyVotesMap.get(v.Game_ID) || 0) + 1);
                }
            }
            const trendingGames = [...weeklyVotesMap.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([gid]) => this.gamesCache.find(g => g.Game_ID === gid))
                .filter(Boolean);

            // Recently archived
            const archivedGames = this.gamesCache
                .filter(g => g.Status === 'Archived')
                .sort((a, b) => new Date(b.Last_Vote_Timestamp_UTC).getTime() - new Date(a.Last_Vote_Timestamp_UTC).getTime())
                .slice(0, 5);

            const embed = new EmbedBuilder()
                .setTitle('📊 Loca Rankings')
                .setColor(0x5865F2)
                .setFooter({ text: 'Updated daily at midnight · /dashboard to refresh' })
                .setTimestamp();

            const hasAnyData = popularGames.length > 0 || risingGames.length > 0 || trendingGames.length > 0 || archivedGames.length > 0;

            if (!hasAnyData) {
                embed.setDescription('No games yet — be the first to submit!');
            } else {
                if (popularGames.length > 0) {
                    embed.addFields({
                        name: '🔥 Popular',
                        value: popularGames.map(g => {
                            const langs = (g.Requested_Languages || '').split('|').map(l => l.trim()).filter(Boolean).join(', ');
                            return `**${g.Canonical_Title}**${langs ? ` — ${langs}` : ''}`;
                        }).join('\n'),
                        inline: false
                    });
                }

                if (risingGames.length > 0) {
                    embed.addFields({
                        name: '📈 Rising',
                        value: risingGames.map(g => {
                            const langs = (g.Requested_Languages || '').split('|').map(l => l.trim()).filter(Boolean).join(', ');
                            return `**${g.Canonical_Title}**${langs ? ` — ${langs}` : ''}`;
                        }).join('\n'),
                        inline: false
                    });
                }

                if (trendingGames.length > 0) {
                    const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
                    embed.addFields({
                        name: '📊 Trending This Week',
                        value: trendingGames.map((g, i) => `${medals[i]} **${g.Canonical_Title}**`).join('\n'),
                        inline: false
                    });
                }

                if (archivedGames.length > 0) {
                    embed.addFields({
                        name: '❄️ Recently Archived',
                        value: archivedGames.map(g => `**${g.Canonical_Title}**`).join('\n'),
                        inline: false
                    });
                }
            }

            // Find or create pinned dashboard thread
            let dashThread = null;

            // Search active threads
            const active = await channel.threads.fetchActive().catch(() => ({ threads: new Map() }));
            dashThread = active.threads.find(t => t.name === DASHBOARD_NAME) || null;

            if (dashThread) {
                // Update existing thread's starter message
                const starter = await dashThread.fetchStarterMessage().catch(() => null);
                if (starter) {
                    await starter.edit({ embeds: [embed] }).catch(() => { });
                }
            } else {
                // Create new pinned thread
                dashThread = await channel.threads.create({
                    name: DASHBOARD_NAME,
                    message: { embeds: [embed] }
                });
                await dashThread.pin().catch(() => { });
            }

            console.log(`   ✅ Dashboard updated in ${guild.name}`);
            return dashThread;
        } catch (e) {
            console.error(`   ❌ Error updating dashboard for ${guild?.name}: ${e.message}`);
            return null;
        }
    }

    async autoArchiveGames() {
        console.log("🔄 Running daily auto-archive sweep...");
        const now = Date.now();
        let archived = 0;

        for (const game of this.gamesCache) {
            const status = game.Status || 'New';
            if (['Archived', 'Approved', 'Reviewed', 'Contacted', 'In Talk', 'Funded', 'In Loc', 'Done', 'Rejected'].includes(status))
                continue;

            const submittedTs = new Date(game.First_Submitted_Timestamp_UTC).getTime();
            if (isNaN(submittedTs)) continue;

            const ageDays = (now - submittedTs) / 86400000;
            if (ageDays >= ARCHIVE_DAYS && (game.Total_Votes || 0) < ARCHIVE_MIN_VOTES) {
                try {
                    // Update status in sheet
                    game._row.set('Status', 'Archived');
                    await game._row.save();
                    game.Status = 'Archived';
                    archived++;

                    // Edit thread embed in-place in NEW_CHANNEL_ID
                    if (NEW_CHANNEL_ID && game.Thread_ID) {
                        for (const guild of this.client.guilds.cache.values()) {
                            try {
                                const channel = guild.channels.cache.get(NEW_CHANNEL_ID) ||
                                    await guild.channels.fetch(NEW_CHANNEL_ID).catch(() => null);
                                if (!channel) continue;

                                const thread = await guild.channels.fetch(game.Thread_ID).catch(() => null);
                                if (!thread) continue;

                                const starter = await thread.fetchStarterMessage().catch(() => null);
                                if (starter) {
                                    const oldEmbed = starter.embeds[0];
                                    const updatedEmbed = new EmbedBuilder()
                                        .setTitle(`❄️ ${game.Canonical_Title}`)
                                        .setDescription(oldEmbed?.description || "This game has been archived.")
                                        .setColor(0x808080)
                                        .setFooter({ text: "The more votes, the higher the chance of localization!" });

                                    if (oldEmbed?.thumbnail?.url) updatedEmbed.setThumbnail(oldEmbed.thumbnail.url);
                                    if (oldEmbed?.fields) updatedEmbed.addFields(oldEmbed.fields);

                                    await starter.edit({ embeds: [updatedEmbed] }).catch(() => { });
                                    await thread.setName(`❄️ ${game.Canonical_Title}`.substring(0, 100)).catch(() => { });
                                }

                                await this._ensureAndApplyTags(channel, thread, game);
                                break;
                            } catch (innerErr) {
                                console.warn(`   ⚠️ Could not update thread for ${game.Game_ID}: ${innerErr.message}`);
                            }
                        }
                    }

                    console.log(`   ❄️ Archived: ${game.Canonical_Title} (${game.Total_Votes} votes, ${Math.floor(ageDays)} days old)`);
                } catch (e) {
                    console.error(`   ⚠️ Archive error for ${game.Game_ID}: ${e.message}`);
                }
            }
        }

        // Update dashboard for all guilds after archive sweep
        for (const guild of this.client.guilds.cache.values()) {
            await this.updateDashboard(guild).catch(() => { });
        }

        console.log(`❄️ Archive sweep complete: ${archived} games.`);
    }

    async postWeeklyTrending(manualGuild = null) {
        if (!TRENDING_CHANNEL_ID) return;
        console.log("📊 Running weekly trending summary...");

        const now = Date.now();
        const weekAgo = now - (7 * 86400000);

        const weeklyVotesMap = new Map();
        for (const v of this.votesCache) {
            const vts = new Date(v.Timestamp_UTC).getTime();
            if (vts >= weekAgo) {
                weeklyVotesMap.set(v.Game_ID, (weeklyVotesMap.get(v.Game_ID) || 0) + 1);
            }
        }

        if (weeklyVotesMap.size === 0) return;

        const sorted = [...weeklyVotesMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const embed = new EmbedBuilder()
            .setTitle("🔥 Weekly Trending Games")
            .setDescription("These games are gaining the most momentum this week!")
            .setColor(0xFFAA00)
            .setTimestamp();

        for (let i = 0; i < sorted.length; i++) {
            const [gid, count] = sorted[i];
            const g = this.gamesCache.find(x => x.Game_ID === gid);
            if (!g) continue;

            const tagMap = { 'New': '🆕', 'Rising': '📈', 'Popular': '🔥', 'Approved': '✅', 'Archived': '❄️' };
            const emoji = tagMap[g.Status] || '🆕';
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;

            embed.addFields({
                name: `${medal} ${g.Canonical_Title} ${emoji}`,
                value: `Platform: ${g.Platform} | Status: ${emoji} ${g.Status}\nThis game is getting votes!`,
                inline: false
            });
        }

        // Handle multi-server: if manualGuild provided (slash command), use that.
        // Otherwise (automated task), loop through all guilds the bot is in.
        const guilds = manualGuild ? [manualGuild] : [...this.client.guilds.cache.values()];

        for (const guild of guilds) {
            try {
                const channel = await guild.channels.fetch(TRENDING_CHANNEL_ID).catch(() => null);
                if (channel?.isTextBased()) await channel.send({ embeds: [embed] });
            } catch (e) {
                console.error(`   ⚠️ Trending report error for guild ${guild.name}: ${e.message}`);
            }
        }
        console.log("✅ Weekly trending posted.");
    }

    async postToGameChannel(guild, gameId, title, link, platform, language, reason, description, image, targetChannelId = NEW_CHANNEL_ID, chatHistory = []) {
        if (!targetChannelId) { console.log(`   → Posting skipped (Channel ID not set)`); return; }
        try {
            const channel = guild.channels.cache.get(targetChannelId) ||
                await guild.channels.fetch(targetChannelId).catch(() => null);

            if (!channel) {
                console.log(`   ⚠️ Target channel ${targetChannelId} not found`);
                return;
            }

            const game = this.gamesCache.find(g => g.Game_ID === gameId);
            const statusLabel = game ? game.Status : 'New';
            const emojiMap = { 'New': '🆕', 'Rising': '📈', 'Popular': '🔥', 'Approved': '✅', 'Archived': '❄️' };
            const statusEmoji = emojiMap[statusLabel] || '🎮';

            // Removed Game ID from title for cleaner aesthetics
            const threadTitle = `${statusEmoji} ${title}`.substring(0, 100);

            const embed = new EmbedBuilder()
                .setTitle(`${statusEmoji} ${title}`)
                .setDescription(description || reason || "Support this game's localization!")
                .setColor(statusLabel === 'Popular' ? 0xFF4500 : statusLabel === 'Rising' ? 0xFFAA00 : 0x0099FF)
                .addFields(
                    { name: "🔗 Store Link", value: link, inline: false },
                    { name: "🖥️ Platform", value: platform, inline: true },
                    { name: "🌍 Requested Language", value: language, inline: true },
                    { name: "🆔 Game ID", value: `\`${gameId}\``, inline: true }
                )
                .setFooter({ text: "The more votes, the higher the chance of localization!" });

            if (image) embed.setThumbnail(image);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`persistent_vote_button_${gameId}`)
                    .setLabel('🗳️ Vote for This Game')
                    .setStyle(ButtonStyle.Primary)
            );

            let message;
            if (channel.type === ChannelType.GuildForum) {
                // 🔍 DUPLICATE PREVENTION: Search for an existing thread for this game in this channel
                // We now search by title since the user requested to remove IDs from titles
                const activeThreads = await channel.threads.fetchActive().catch(() => ({ threads: new Map() }));
                let existingThread = null;
                if (!existingThread) {
                    // Search active threads first
                    const candidates = [...activeThreads.threads.values()].filter(t => t.name.includes(title));
                    for (const cand of candidates) {
                        const starter = await cand.fetchStarterMessage().catch(() => null);
                        const embedMsg = starter?.embeds?.[0];
                        const foundIdField = embedMsg?.fields?.find(f => f.name.includes('ID'));
                        if (foundIdField && foundIdField.value.includes(gameId)) {
                            existingThread = cand;
                            break;
                        }
                    }
                }
                
                // If not found in active, directly fetch by Thread ID if we have it in the sheet
                if (!existingThread && game && game.Thread_ID) {
                    try {
                        const preciseThread = await channel.threads.fetch(game.Thread_ID).catch(() => null);
                        if (preciseThread && preciseThread.parentId === channel.id) {
                            existingThread = preciseThread;
                        }
                    } catch(e) {}
                }

                if (existingThread) {
                    console.log(`   🔎 Found existing thread for ${gameId}, updating instead of re-posting.`);
                    // Update the existing thread (edit the starter message)
                    const starterMsg = await existingThread.fetchStarterMessage().catch(() => null);
                    if (starterMsg) {
                        await starterMsg.edit({ embeds: [embed], components: [row] }).catch(() => { });
                    }
                    await existingThread.setName(threadTitle).catch(() => { });
                    message = existingThread;
                    if (game) await this._ensureAndApplyTags(channel, existingThread, game);
                } else {
                    const thread = await channel.threads.create({
                        name: threadTitle,
                        message: { embeds: [embed], components: [row] },
                    });
                    message = thread;
                    if (game) await this._ensureAndApplyTags(channel, thread, game);
                }
            } else {
                // Standard text channel logic - with duplicate prevention
                let existingMsg = null;
                if (game && game.Thread_ID) {
                    existingMsg = await channel.messages.fetch(game.Thread_ID).catch(() => null);
                }

                if (existingMsg && existingMsg.channelId === channel.id) {
                    console.log(`   🔎 Found existing message for ${gameId}, updating instead of re-sending.`);
                    await existingMsg.edit({ embeds: [embed], components: [row] }).catch(() => { });
                    message = existingMsg;
                } else {
                    message = await channel.send({ embeds: [embed], components: [row] });
                }
            }

            // Update Thread_ID in Google Sheets
            if (game) {
                game._row.set('Thread_ID', String(message.id));
                await game._row.save();
                game.Thread_ID = String(message.id);
            }

            console.log(`   ✅ Handled in ${channel.name}: ${message.url || message.id}`);

            // If there's chat history, it means the game moved/leveled up!
            if (chatHistory && chatHistory.length > 0 && message.isThread()) {
                const levelUpEmbed = new EmbedBuilder()
                    .setTitle(`${statusEmoji} Level Up! Now ${statusLabel}`)
                    .setDescription(`🌟 **${title}** has gained enough momentum to reach the **${statusLabel}** status!`)
                    .setColor(statusLabel === 'Popular' ? 0xFF4500 : 0xFFAA00)
                    .setFooter({ text: "Discussion migrated from the previous tier." });

                const historyText = chatHistory.join('\n').substring(0, 4000);
                const historyEmbed = new EmbedBuilder()
                    .setTitle("📝 Previous Discussion History")
                    .setDescription(historyText || "_No text-only messages found._")
                    .setColor(0xCCCCCC);

                await message.send({ embeds: [levelUpEmbed, historyEmbed] }).catch(() => { });
            }
        } catch (e) {
            console.error(`   ❌ Error posting to channel: ${e.message}`);
        }
    }

    // ── Command Registration ────────────────────────────────────────────────────
    async registerCommands() {
        const commands = [
            { name: 'submit', description: 'Submit a game for localization' },
            {
                name: 'search', description: 'Search for games in the database',
                options: [{ name: 'query', type: 3, description: 'Search term', required: true }]
            },
            { name: 'top', description: 'Show top requested games' },
            {
                name: 'setup_submission', description: '[ADMIN] Create a persistent submission button',
                default_member_permissions: '8'
            },
            {
                name: 'admin_edit_title', description: '[ADMIN] Edit game title',
                options: [
                    { name: 'game_id', type: 3, description: 'Game ID', required: true },
                    { name: 'new_title', type: 3, description: 'New title', required: true }
                ], default_member_permissions: '8'
            },
            {
                name: 'admin_blacklist', description: '[ADMIN] Blacklist a user',
                options: [{ name: 'user', type: 6, description: 'User to blacklist', required: true }],
                default_member_permissions: '8'
            },
            {
                name: 'admin_unblacklist', description: '[ADMIN] Remove user from blacklist',
                options: [{ name: 'user', type: 6, description: 'User to unblacklist', required: true }],
                default_member_permissions: '8'
            },
            {
                name: 'admin_status', description: '[ADMIN] Update game status',
                options: [
                    { name: 'game_id', type: 3, description: 'Game ID', required: true },
                    {
                        name: 'status', type: 3, description: 'New status', required: true,
                        choices: STATUSES.map(s => ({ name: s, value: s }))
                    }
                ], default_member_permissions: '8'
            },
            {
                name: 'admin_merge', description: '[ADMIN] Merge two game entries',
                options: [
                    { name: 'game_id_keep', type: 3, description: 'ID to keep', required: true },
                    { name: 'game_id_remove', type: 3, description: 'ID to merge & remove', required: true }
                ], default_member_permissions: '8'
            },
            {
                name: 'admin_stats', description: '[ADMIN] Show detailed stats with vote counts',
                default_member_permissions: '8'
            },
            {
                name: 'admin_sync_tags', description: '[ADMIN] Sync forum tags for all games',
                default_member_permissions: '8'
            },
            {
                name: 'admin_test_archive', description: '[ADMIN] Trigger the auto-archive sweep manually',
                default_member_permissions: '8'
            },
            {
                name: 'admin_test_trending', description: '[ADMIN] Trigger the weekly trending summary manually',
                default_member_permissions: '8'
            },
            {
                name: 'refresh', description: '[ADMIN] Refresh games cache from Google Sheets',
                default_member_permissions: '8'
            },
            { name: 'dashboard', description: 'Update the pinned rankings thread now' },
            {
                name: 'approve', description: '[ADMIN] Approve a game for localization pursuit',
                options: [{ type: 3, name: 'game_id', description: 'Game ID (e.g. GAME_00001)', required: true }],
                default_member_permissions: '8'
            },
        ];

        const rest = new REST({ version: '10' }).setToken(TOKEN);
        try {
            const clientId = CLIENT_ID || this.client.user.id;
            if (GUILD_ID) {
                await rest.put(Routes.applicationGuildCommands(clientId, GUILD_ID), { body: commands });
                console.log(`✅ Commands registered to guild: ${GUILD_ID}`);
            } else {
                await rest.put(Routes.applicationCommands(clientId), { body: commands });
                console.log("✅ Commands registered globally");
            }
        } catch (e) {
            console.error("❌ Error registering commands:", e);
        }
    }

    // ── Events ──────────────────────────────────────────────────────────────────
    setupEvents() {
        this.client.once(Events.ClientReady, async () => {
            console.log(`\n${'='.repeat(50)}`);
            console.log(`✅ Bot is ready! Logged in as: ${this.client.user.tag}`);
            console.log(`Servers: ${this.client.guilds.cache.size}`);
            console.log(`${'='.repeat(50)}\n`);

            try {
                await this.setupSheets();
            } catch (e) {
                console.error("❌ Failed to setup Google Sheets:", e.message);
                process.exit(1);
            }
            try {
                await this.registerCommands();
            } catch (e) {
                console.error("❌ Failed to register commands:", e.message);
            }

            // Start Maintenance loops (using cron for precise timing)

            // 1. Daily Archive Sweep - Every day at 00:00 (Midnight)
            cron.schedule('0 0 * * *', () => {
                console.log("⏰ Cron: Starting Daily Archive Sweep...");
                this.autoArchiveGames().catch(e => console.error("❌ Cron Archive Error:", e));
            });

            // 2. Global Sync (Audit) - Every 3 hours, offset by 30 minutes (00:30, 03:30...)
            cron.schedule('30 */3 * * *', () => {
                console.log("⏰ Cron: Starting Global Sync Audit (Every 3h)...");
                for (const guild of this.client.guilds.cache.values()) {
                    this.syncAllGameStatuses(guild).catch(e => console.error(`❌ Cron Sync Error (${guild.name}):`, e));
                }
            });

            // 3. Daily Dashboard Update - Every day at midnight
            cron.schedule('0 0 * * *', () => {
                console.log("⏰ Cron: Updating pinned dashboard...");
                for (const guild of this.client.guilds.cache.values()) {
                    this.updateDashboard(guild).catch(e => console.error(`❌ Cron Dashboard Error (${guild.name}):`, e));
                }
            });
        });

        this.client.on(Events.InteractionCreate, async (interaction) => {
            try {
                if (interaction.isChatInputCommand()) await this.handleSlashCommand(interaction);
                else if (interaction.isButton()) await this.handleButton(interaction);
                else if (interaction.isModalSubmit()) {
                    // DEFER MODALS IMMEDIATELY (except Step 1) to prevent 3s timeout
                    if (interaction.customId !== 'submission_part1') {
                        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] }).catch(() => { });
                    }
                    await this.handleModalSubmit(interaction);
                }
            } catch (e) {
                console.error(`❌ Interaction error:`, e);
                const msg = { content: "❌ An error occurred. Please try again.", flags: [MessageFlags.Ephemeral] };
                try {
                    if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
                    else await interaction.reply(msg);
                } catch { /* can't respond */ }
            }
        });

        // ── Anti-Chat & Floating Button Logic ───────────────
        this.client.on(Events.MessageCreate, async (message) => {
            if (!message.guild || message.author.bot) return;

            const managedChannels = [NEW_CHANNEL_ID, RISING_CHANNEL_ID, POPULAR_CHANNEL_ID, APPROVED_CHANNEL_ID, TRENDING_CHANNEL_ID, COMMAND_CHANNEL_ID];

            // 1. Anti-Chat for main gallery channels
            if (managedChannels.includes(message.channel.id)) {
                if (!message.channel.isThread()) {
                    await message.delete().catch(() => { });
                }
            }

            // 2. Floating Button refresh for game threads
            if (message.channel.isThread()) {
                await this._refreshFloatingVoteButton(message.channel);
            }
        });
    }

    // ── Slash Commands ──────────────────────────────────────────────────────────
    isInCommandChannel(interaction) {
        if (!COMMAND_CHANNEL_ID) return true;
        if (interaction.channelId === COMMAND_CHANNEL_ID) return true;
        if (interaction.member?.permissions?.has(PermissionFlagsBits.Administrator)) return true;
        return false;
    }

    async handleSlashCommand(interaction) {
        if (!this.isInCommandChannel(interaction)) {
            return interaction.reply({
                content: `❌ Please use this command in <#${COMMAND_CHANNEL_ID}>.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        const { commandName } = interaction;

        if (commandName === 'submit') {
            return interaction.showModal(buildSubmissionModal1());
        }

        if (commandName === 'search') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const query = interaction.options.getString('query');
            const normQ = normalizeTitle(query);
            const results = this.gamesCache
                .filter(g => {
                    const t = normalizeTitle(g.Canonical_Title);
                    return t.includes(normQ) || fuzzyRatio(normQ, t) > 70;
                })
                .slice(0, 10);

            if (!results.length)
                return interaction.followUp({ content: "❌ No games found matching your search.", flags: [MessageFlags.Ephemeral] });

            const embed = new EmbedBuilder().setTitle(`🔍 Search Results for '${query}'`).setColor(0x0099FF);
            results.forEach(g => embed.addFields({
                name: `${g.Canonical_Title} (${g.Game_ID})`,
                value: `${g.Platform} | Status: ${g.Status}\nLanguages: ${g.Requested_Languages || 'N/A'}`,
                inline: false,
            }));
            return interaction.followUp({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        if (commandName === 'top') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const sorted = [...this.gamesCache].sort((a, b) => b.Total_Votes - a.Total_Votes);
            const embed = new EmbedBuilder()
                .setTitle("🏆 Top Requested Games")
                .setDescription("Most requested games for localization")
                .setColor(0xFFD700);
            sorted.slice(0, 10).forEach((g, i) => {
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
                embed.addFields({
                    name: `${medal} ${g.Canonical_Title}`,
                    value: `${g.Platform} | Status: ${g.Status}\nLanguages: ${g.Requested_Languages || 'N/A'}\nID: \`${g.Game_ID}\``,
                    inline: false,
                });
            });
            return interaction.followUp({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        if (commandName === 'setup_submission') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('persistent_submit_button').setLabel('📝 Submit a Game').setStyle(ButtonStyle.Success)
            );
            await interaction.channel.send({ content: "**Click the button below to submit a game for localization!** 👇", components: [row] });
            return interaction.reply({ content: `✅ Submission button created in ${interaction.channel}!`, flags: [MessageFlags.Ephemeral] });
        }

        if (commandName === 'admin_edit_title') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const gameId = interaction.options.getString('game_id');
            const newTitle = interaction.options.getString('new_title');
            const game = this.gamesCache.find(g => g.Game_ID === gameId);
            if (!game) return interaction.followUp({ content: "❌ Game not found.", flags: [MessageFlags.Ephemeral] });
            game._row.set('Canonical_Title', newTitle);
            await game._row.save();
            game.Canonical_Title = newTitle;
            return interaction.followUp({ content: `✅ Title updated to **${newTitle}**`, flags: [MessageFlags.Ephemeral] });
        }

        if (commandName === 'admin_blacklist') {
            const user = interaction.options.getUser('user');
            this.blacklist.add(String(user.id));
            this.saveBlacklist();
            return interaction.reply({ content: `✅ ${user} has been blacklisted.`, flags: [MessageFlags.Ephemeral] });
        }

        if (commandName === 'admin_unblacklist') {
            const user = interaction.options.getUser('user');
            if (!this.blacklist.has(String(user.id)))
                return interaction.reply({ content: `⚠️ ${user} is not blacklisted.`, flags: [MessageFlags.Ephemeral] });
            this.blacklist.delete(String(user.id));
            this.saveBlacklist();
            return interaction.reply({ content: `✅ ${user} has been removed from the blacklist.`, flags: [MessageFlags.Ephemeral] });
        }

        if (commandName === 'admin_status') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const gameId = interaction.options.getString('game_id');
            const newStatus = interaction.options.getString('status');
            const game = this.gamesCache.find(g => g.Game_ID === gameId);
            if (!game) return interaction.followUp({ content: "❌ Game not found.", flags: [MessageFlags.Ephemeral] });

            const channelMap = {
                'New': NEW_CHANNEL_ID,
                'Rising': RISING_CHANNEL_ID,
                'Popular': POPULAR_CHANNEL_ID,
                'Approved': APPROVED_CHANNEL_ID
            };
            const targetChannelId = channelMap[newStatus];

            try {
                // Delete old post/thread from the previous channel
                await this._deleteOldPost(game);

                // Update status in sheet
                game._row.set('Status', newStatus);
                await game._row.save();
                game.Status = newStatus;

                // Re-post to the new status channel if it's one of the momentum categories
                if (targetChannelId) {
                    const appId = extractSteamAppId(game.Store_Link);
                    let description = null, image = null;
                    if (appId) {
                        const details = await this.fetchSteamGameDetails(appId);
                        description = details?.description;
                        image = details?.image;
                    }
                    await this.postToGameChannel(interaction.guild, game.Game_ID, game.Canonical_Title, game.Store_Link, game.Platform, game.Requested_Languages.split('|')[0], (game.Notes || ""), description, image, targetChannelId);
                }

                return interaction.followUp({ content: `✅ Status updated to **${newStatus}** and game post has been moved.`, flags: [MessageFlags.Ephemeral] });
            } catch (err) {
                console.error(err);
                return interaction.followUp({ content: `❌ Error updating status: ${err.message}`, flags: [MessageFlags.Ephemeral] });
            }
        }

        if (commandName === 'admin_merge') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const keepId = interaction.options.getString('game_id_keep');
            const removeId = interaction.options.getString('game_id_remove');
            const keepGame = this.gamesCache.find(g => g.Game_ID === keepId);
            const removeGame = this.gamesCache.find(g => g.Game_ID === removeId);
            if (!keepGame) return interaction.followUp({ content: `❌ Game \`${keepId}\` not found.`, flags: [MessageFlags.Ephemeral] });
            if (!removeGame) return interaction.followUp({ content: `❌ Game \`${removeId}\` not found.`, flags: [MessageFlags.Ephemeral] });

            const newVotes = keepGame.Total_Votes + removeGame.Total_Votes;
            const keepLangs = (keepGame.Requested_Languages || '').split('|').map(l => l.trim()).filter(Boolean);
            const removeLangs = (removeGame.Requested_Languages || '').split('|').map(l => l.trim()).filter(Boolean);
            const mergedLangs = [...new Set([...keepLangs, ...removeLangs])];

            keepGame._row.set('Total_Votes', newVotes);
            keepGame._row.set('Requested_Languages', mergedLangs.join('|'));
            await keepGame._row.save();
            keepGame.Total_Votes = newVotes;
            keepGame.Requested_Languages = mergedLangs.join('|');

            // Reassign votes in cache and sheet
            for (const v of this.votesCache) {
                if (v.Game_ID === removeId) {
                    v.Game_ID = keepId;
                    v._row.set('Game_ID', keepId);
                    await v._row.save();
                }
            }

            await removeGame._row.delete();
            this.gamesCache.splice(this.gamesCache.indexOf(removeGame), 1);

            return interaction.followUp({
                content: `✅ Merged \`${removeId}\` into \`${keepId}\`!\n• Combined votes: **${newVotes}**\n• Languages: ${mergedLangs.join(', ')}\n• Game \`${removeId}\` removed.`,
                flags: [MessageFlags.Ephemeral],
            });
        }

        if (commandName === 'admin_stats') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const totalGames = this.gamesCache.length;
            const totalVotes = this.gamesCache.reduce((s, g) => s + (g.Total_Votes || 0), 0);
            const uniqueVoters = new Set(this.votesCache.map(v => v.Discord_User_ID)).size;
            const sorted = [...this.gamesCache].sort((a, b) => b.Total_Votes - a.Total_Votes);
            const top5 = sorted.slice(0, 5)
                .map((g, i) => `${i + 1}. **${g.Canonical_Title}** — ${g.Total_Votes} votes`)
                .join('\n');

            const embed = new EmbedBuilder()
                .setTitle("📊 Bot Statistics (Admin)")
                .setColor(0x00FF00)
                .addFields(
                    { name: "Total Games", value: String(totalGames), inline: true },
                    { name: "Total Votes", value: String(totalVotes), inline: true },
                    { name: "Unique Voters", value: String(uniqueVoters), inline: true },
                    { name: "🏆 Top 5 Games", value: top5 || "No games yet", inline: false }
                );
            return interaction.followUp({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        if (commandName === 'admin_sync_tags') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const synced = await this.syncAllGameStatuses(interaction.guild);
            return interaction.followUp({ content: `✅ Synchronized **${synced}** games into their correct status channels.`, flags: [MessageFlags.Ephemeral] });
        }

        if (commandName === 'admin_test_archive') {
            await interaction.reply({ content: "🔄 Starting manual archive sweep...", flags: [MessageFlags.Ephemeral] });
            await this.autoArchiveGames();
            return interaction.followUp({ content: "✅ Archive sweep complete.", flags: [MessageFlags.Ephemeral] });
        }

        if (commandName === 'admin_test_trending') {
            await interaction.reply({ content: "📊 Generating manual trending report...", flags: [MessageFlags.Ephemeral] });
            await this.postWeeklyTrending(interaction.guild);
            return interaction.followUp({ content: "✅ Trending report posted.", flags: [MessageFlags.Ephemeral] });
        }

        if (commandName === 'refresh') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            await this.refreshCache();
            return interaction.followUp({ content: `✅ Cache refreshed! ${this.gamesCache.length} games loaded.`, flags: [MessageFlags.Ephemeral] });
        }

        if (commandName === 'dashboard') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            await this.updateDashboard(interaction.guild);
            return interaction.followUp({ content: "✅ Rankings updated!", flags: [MessageFlags.Ephemeral] });
        }

        if (commandName === 'approve') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            if (!interaction.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
                return interaction.followUp({ content: "❌ You need Administrator permissions to use this command.", flags: [MessageFlags.Ephemeral] });
            }
            const gameId = interaction.options.getString('game_id');
            const game = this.gamesCache.find(g => g.Game_ID === gameId);
            if (!game) return interaction.followUp({ content: "❌ Game not found.", flags: [MessageFlags.Ephemeral] });

            try {
                // Update status in sheet
                game._row.set('Status', 'Approved');
                await game._row.save();
                game.Status = 'Approved';

                // Edit thread embed in-place
                if (NEW_CHANNEL_ID && game.Thread_ID) {
                    for (const guild of this.client.guilds.cache.values()) {
                        try {
                            const channel = guild.channels.cache.get(NEW_CHANNEL_ID) ||
                                await guild.channels.fetch(NEW_CHANNEL_ID).catch(() => null);
                            if (!channel) continue;

                            const thread = await guild.channels.fetch(game.Thread_ID).catch(() => null);
                            if (!thread) continue;

                            const starter = await thread.fetchStarterMessage().catch(() => null);
                            if (starter) {
                                const oldEmbed = starter.embeds[0];
                                const updatedEmbed = new EmbedBuilder()
                                    .setTitle(`✅ ${game.Canonical_Title}`)
                                    .setDescription(oldEmbed?.description || "Support this game's localization!")
                                    .setColor(0x00CC44)
                                    .setFooter({ text: "The more votes, the higher the chance of localization!" });

                                if (oldEmbed?.thumbnail?.url) updatedEmbed.setThumbnail(oldEmbed.thumbnail.url);
                                if (oldEmbed?.fields) updatedEmbed.addFields(oldEmbed.fields);

                                const row = new ActionRowBuilder().addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`persistent_vote_button_${game.Game_ID}`)
                                        .setLabel('🗳️ Vote for This Game')
                                        .setStyle(ButtonStyle.Primary)
                                );

                                await starter.edit({ embeds: [updatedEmbed], components: [row] }).catch(() => { });
                                await thread.setName(`✅ ${game.Canonical_Title}`.substring(0, 100)).catch(() => { });
                            }

                            await this._ensureAndApplyTags(channel, thread, game);
                            break;
                        } catch (innerErr) {
                            console.warn(`   ⚠️ Could not update thread for ${gameId}: ${innerErr.message}`);
                        }
                    }
                }

                await this.updateDashboard(interaction.guild);
                return interaction.followUp({ content: `✅ **${game.Canonical_Title}** marked as Approved.`, flags: [MessageFlags.Ephemeral] });
            } catch (err) {
                console.error(err);
                return interaction.followUp({ content: `❌ Error approving game: ${err.message}`, flags: [MessageFlags.Ephemeral] });
            }
        }
    }

    // ── Button Handler ──────────────────────────────────────────────────────────
    async handleButton(interaction) {

        // Persistent submit button (from /setup_submission message)
        if (interaction.customId === 'persistent_submit_button') {
            return interaction.showModal(buildSubmissionModal1());
        }

        // "Continue to Step 2" button shown after submission modal 1 is submitted
        if (interaction.customId === 'submission_continue') {
            const pending = this.pendingSubmissions.get(String(interaction.user.id));
            if (!pending)
                return interaction.reply({ content: "❌ Session expired. Please start over by clicking Submit a Game.", flags: [MessageFlags.Ephemeral] });
            return interaction.showModal(buildSubmissionModal2(pending.owned));
        }

        // Persistent vote button (handles both old forum threads and new channel posts)
        if (interaction.customId === 'persistent_vote_button' || interaction.customId.startsWith('persistent_vote_button_')) {
            let gameId = null;

            // Priority 1: Extract from customId (for new channel posts)
            if (interaction.customId.startsWith('persistent_vote_button_')) {
                gameId = interaction.customId.replace('persistent_vote_button_', '');
            }

            // Priority 2: Extract from Embed fields (fallback if button clicked from outside thread)
            if (!gameId && interaction.message?.embeds?.[0]) {
                const embed = interaction.message.embeds[0];
                const idField = embed.fields.find(f => f.name.includes('Game ID'));
                if (idField) {
                    const match = idField.value.match(/`?GAME_(\d+)`?/);
                    if (match) gameId = `GAME_${match[1]}`;
                }
            }

            // Priority 3: Extract from Thread Name (legacy forum logic)
            if (!gameId && interaction.channel?.isThread?.()) {
                const match = interaction.channel.name.match(/\(GAME_(\d+)\)/);
                if (match) gameId = `GAME_${match[1]}`;
            }

            if (!gameId)
                return interaction.reply({ content: "❌ Could not determine Game ID from this post. Support is already aware of this issue.", flags: [MessageFlags.Ephemeral] });

            // Voting via button is ALWAYS allowed regardless of daily limit
            const check = await this.antiSpamCheck(interaction.user, interaction.guild, true);
            if (!check.allowed)
                return interaction.reply({ content: `❌ ${check.reason}`, flags: [MessageFlags.Ephemeral] });

            return interaction.showModal(buildVoteModal(gameId));
        }

        // Unknown button — acknowledge silently so Discord doesn't show "interaction failed"
        console.warn(`⚠️ Unhandled button: ${interaction.customId}`);
        return interaction.reply({ content: "❌ Unknown button.", flags: [MessageFlags.Ephemeral] });
    }

    // ── Modal Submit Handler ────────────────────────────────────────────────────
    async handleModalSubmit(interaction) {

        // ── Submission Form 1 ─────────────────────────────────────────────────
        if (interaction.customId === 'submission_part1') {
            const gameTitle = interaction.fields.getTextInputValue('game_title').trim();
            const storeLink = interaction.fields.getTextInputValue('store_link').trim();

            if (!gameTitle || !storeLink) {
                return interaction.reply({ content: "❌ Game title and link are required.", flags: [MessageFlags.Ephemeral] });
            }

            if (!storeLink.startsWith('https://store.steampowered.com/') && !storeLink.startsWith('http://store.steampowered.com/')) {
                return interaction.reply({ content: "❌ Please provide a valid Steam Store URL", flags: [MessageFlags.Ephemeral] });
            }

            const language = (interaction.fields.getStringSelectValues('language') || [])[0];
            const owned = (interaction.fields.getStringSelectValues('owned') || [])[0];

            if (!language || !owned)
                return interaction.reply({ content: "❌ Please select all dropdown options.", flags: [MessageFlags.Ephemeral] });

            // Store part-1 data (Platform defaults to PC as per client request to simplify)
            this.pendingSubmissions.set(String(interaction.user.id), { platform: 'PC', language, owned, gameTitle, storeLink, part1Interaction: interaction });

            const continueBtn = new ButtonBuilder()
                .setCustomId('submission_continue')
                .setLabel('Continue to Step 2 →')
                .setStyle(ButtonStyle.Primary);

            return interaction.reply({
                content: [
                    `✅ **Step 1 complete!** Here's what you entered:`,
                    `> 🌍 Language: **${language}**`,
                    `> 🎮 Game: **${gameTitle}**`,
                    `> 🔗 Link: ${storeLink}`,
                    `> 🎟️ Own it: **${owned}**`,
                    ``,
                    `Click the button below to continue.`,
                    ``,
                    `> 💡 **Note:** This is not a payment and does not obligate you. It helps us evaluate whether a localization project would be financially feasible before approaching the developer or launching a crowdfunding campaign.`,
                ].join('\n'),
                components: [new ActionRowBuilder().addComponents(continueBtn)],
                flags: [MessageFlags.Ephemeral],
            });
        }

        // ── Submission Form 2 ─────────────────────────────────────────────────
        if (interaction.customId === 'submission_part2') {
            // Already deferred by early-responder wrapper in InteractionCreate

            const data1 = this.pendingSubmissions.get(String(interaction.user.id));
            if (!data1)
                return interaction.followUp({ content: "❌ Session expired. Please start again with /submit.", flags: [MessageFlags.Ephemeral] });
            this.pendingSubmissions.delete(String(interaction.user.id));

            const priceStr = interaction.fields.getTextInputValue('price') || '0';
            const price = parsePrice(priceStr);
            const reason = ""; // Notes removed as per client request to prevent unmoderated content

            if (priceStr.trim()) { // Check the original string for validation
                const clean = priceStr.replace(/[^\d.]/g, '');
                if (!clean || isNaN(parseFloat(clean)))
                    return interaction.followUp({ content: "❌ Price must be a valid number (e.g. 15, 20.50).", flags: [MessageFlags.Ephemeral] });
            }

            // We skip the limit check here because processSubmission will handle it only if it's a new game entry.
            const check = await this.antiSpamCheck(interaction.user, interaction.guild, true);
            if (!check.allowed)
                return interaction.followUp({ content: `❌ ${check.reason}`, flags: [MessageFlags.Ephemeral] });

            // Sanitize reason
            const placeholders = ['why localize this game?', 'why should this game be localized?', 'no reason', 'none'];
            let reasonVal = reason.trim();
            if (reasonVal && (placeholders.includes(reasonVal.toLowerCase()) || reasonVal.length < 5 || isGibberish(reasonVal)))
                reasonVal = '';

            try {
                const result = await this.processSubmission(
                    interaction.user,
                    data1.gameTitle, data1.storeLink, data1.platform,
                    data1.language, reasonVal, data1.owned, price,
                    interaction.guild
                );
                // Remove the "Continue to Step 2" button from the Step 1 ephemeral message
                await data1.part1Interaction.editReply({ components: [] }).catch(() => { });
                return interaction.followUp({ content: result.message, flags: [MessageFlags.Ephemeral] });
            } catch (e) {
                console.error('❌ Error processing submission:', e);
                return interaction.followUp({ content: "❌ An error occurred. Please try again later.", flags: [MessageFlags.Ephemeral] });
            }
        }

        // ── Vote Modal (single step: Language + Owned + Price) ─────────────────
        if (interaction.customId.startsWith('vote_modal_')) {
            // Already deferred by early-responder wrapper in InteractionCreate

            const gameId = interaction.customId.slice('vote_modal_'.length);
            const language = (interaction.fields.getStringSelectValues('vote_language') || [])[0];
            const owned = (interaction.fields.getStringSelectValues('vote_owned') || [])[0];
            const price = interaction.fields.getTextInputValue('vote_price') || '';

            if (!language || !owned)
                return interaction.followUp({ content: "❌ Please select all dropdown options." });

            if (price.trim()) {
                const clean = price.replace(/[^\d.]/g, '');
                if (!clean || isNaN(parseFloat(clean)))
                    return interaction.followUp({ content: "❌ Price must be a valid number." });
            }

            try {
                const result = await this.processVote(interaction.user, gameId, language, owned, price);
                return interaction.followUp({ content: result.message });
            } catch (e) {
                console.error('❌ Error processing vote:', e);
                return interaction.followUp({ content: "❌ An error occurred." });
            }
        }

        // Unknown modal — acknowledge silently
        console.warn(`⚠️ Unhandled modal: ${interaction.customId}`);
        return interaction.reply({ content: "❌ Unknown form.", flags: [MessageFlags.Ephemeral] });
    }

    // ── Start ───────────────────────────────────────────────────────────────────
    run() {
        if (!TOKEN) { console.error('❌ DISCORD_TOKEN not set in .env!'); process.exit(1); }
        if (!SPREADSHEET_ID) { console.error('❌ SPREADSHEET_ID not set in .env!'); process.exit(1); }

        console.log('🚀 Starting Game Localization Bot (JS)...');
        this.client.login(TOKEN).catch(e => {
            console.error('❌ Failed to login:', e.message);
            process.exit(1);
        });
    }
}

const bot = new LocalizationBot();
bot.run();
