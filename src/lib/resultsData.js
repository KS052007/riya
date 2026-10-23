// =============================================================================
// RESULTS DATA BY EVENT ID
// To add results for new events, simply append a new event key to this object.
// =============================================================================

export const resultsDataByEvent = {
  ideathon: {
    eventId: "ideathon",
    eyebrow: "IDEATHON 2026",
    title: "Winners & Results",
    subtitle: "Honoring the visionary solutions and outstanding teams of Ideathon 2026.",

    // PODIUM WINNERS (TOP 3)
    top3: [
      {
        rank: 1,
        rankTitle: "1st Place",
        badgeIcon: "🥇",
        // PLACEHOLDER DATA - REPLACE BELOW:
        teamName: "Vaibhav Nargwani",
        projectTitle: "RakshaSetu System",
        description: "Disaster Response & Coordination Platform",
        score: "1st"
      },
      {
        rank: 2,
        rankTitle: "2nd Place",
        badgeIcon: "🥈",
        // PLACEHOLDER DATA - REPLACE BELOW:
        teamName: "Jatin Nahata",
        projectTitle: "CogniTutor",
        description: "Students have endless content, but no clear path to learn.",
        score: "2nd"
      },
      {
        rank: 3,
        rankTitle: "3rd Place",
        badgeIcon: "🥉",
        // PLACEHOLDER DATA - REPLACE BELOW:
        teamName: "RAUSHAN KUMAR PANDEY",
        projectTitle: "CareCircle",
        description: "Strengthening Community Support for the Elderly",
        score: "3rd"
      }
    ],

    // HONORABLE MENTIONS (PLACEHOLDERS WITH CUSTOM TAGS)
    honorableMentions: [
      {
        id: "hm-1",
        rankNumber: 4,
        // PLACEHOLDER DATA - REPLACE BELOW:
        teamName: "Anshika singh",
        projectTitle: "Empowering Farmers with Better Market Intelligence",
        tag: "Best Innovation"
      },
      {
        id: "hm-2",
        rankNumber: 5,
        // PLACEHOLDER DATA - REPLACE BELOW:
        teamName: "DIVYANSH YADAV",
        projectTitle: "DTMF-Based Smart Control System",
        tag: "Best Tech"
      }
    ]
  }

  // Example: Append future events here
  // hackathon: { ... }
};

// Default fallback export
export const ideathonResults = resultsDataByEvent.ideathon;
