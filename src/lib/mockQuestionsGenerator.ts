export interface MockQuestion {
  id: number;
  text: string;
  options: string[];
}

export interface MockCodingQuestion {
  id: number;
  title: string;
  problemStatement: string;
  starterCode: Record<string, string>;
  difficulty: 'Easy/Medium' | 'Advanced';
}

export const getQuestionsForSession = (
  companyName: string,
  sessionType: string,
  count: number = 30
): MockQuestion[] => {
  const company = companyName || 'the company';
  const questions: MockQuestion[] = [];

  for (let i = 1; i <= count; i++) {
    questions.push(generateQuestion(company, sessionType, i));
  }

  return questions;
};

const generateQuestion = (company: string, type: string, index: number): MockQuestion => {
  const t = type.toLowerCase();
  
  if (t === 'mcq') {
    const mcqData = [
      {
        text: `A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train? (Commonly asked in ${company} assessments)`,
        options: ['150 metres', '120 metres', '180 metres', '324 metres']
      },
      {
        text: `In a certain code language, if 'WATER' is written as 'YCVGT', how will 'FIRE' be written in that code for ${company}'s reasoning test?`,
        options: ['HKTG', 'HKUG', 'HLTG', 'IKTG']
      },
      {
        text: `Two ships are sailing in the sea on the two sides of a lighthouse. The angle of elevation of the top of the lighthouse is observed as 30° and 45° respectively. If the lighthouse is 100m high, what is the distance between the two ships?`,
        options: ['273m', '200m', '173m', '300m']
      },
      {
        text: `Look at this series: 2, 1, (1/2), (1/4), ... What number should come next in this sequence common to ${company}'s aptitude section?`,
        options: ['(1/8)', '(1/3)', '(2/8)', '(1/16)']
      },
      {
        text: `A man can row upstream at 8 kmph and downstream at 13 kmph. The speed of the stream is:`,
        options: ['2.5 kmph', '4.2 kmph', '5 kmph', '10.5 kmph']
      },
      {
        text: `The sum of ages of 5 children born at the intervals of 3 years each is 50 years. What is the age of the youngest child?`,
        options: ['4 years', '8 years', '10 years', 'None of these']
      },
      {
        text: `Statements: All branches are flowers. All flowers are leaves. Conclusions: I. All branches are leaves. II. All leaves are branches. Which conclusion follows for ${company}'s logical reasoning pattern?`,
        options: ['Only conclusion I follows', 'Only conclusion II follows', 'Either I or II follows', 'Neither I nor II follows']
      },
      {
        text: `A alone can do a piece of work in 6 days and B alone in 8 days. A and B undertook to do it for $3200. With the help of C, they completed the work in 3 days. How much is to be paid to C?`,
        options: ['$400', '$375', '$600', '$800']
      },
      {
        text: `A bag contains 2 red, 3 green and 2 blue balls. Two balls are drawn at random. What is the probability that none of the balls drawn is blue?`,
        options: ['10/21', '11/21', '2/7', '5/7']
      },
      {
        text: `Find the missing number in the series: 3, 7, 15, 31, 63, ...`,
        options: ['127', '92', '115', '131']
      }
    ];
    
    const data = mcqData[index % mcqData.length];
    return { id: index, text: data.text, options: [...data.options].sort(() => Math.random() - 0.5) };
  }
  
  if (t === 'coding') {
    const codingData = [
      {
        text: `Given an array of integers representing stock prices, what is the most optimal approach to find the maximum profit ${company} could make with one buy and one sell?`,
        options: ['Keep track of the minimum price seen so far and calculate potential profit at each step', 'Use a nested loop to compare every possible pair of buy and sell days', 'Sort the array first and subtract the lowest from highest', 'Use a recursive depth-first search to explore all paths']
      },
      {
        text: `If you were to implement an LRU cache for ${company}'s recently accessed user sessions, which data structures would you combine?`,
        options: ['A Hash Map and a Doubly Linked List', 'A Hash Map and an Array', 'Two Stacks', 'A Binary Search Tree and a Queue']
      },
      {
        text: `Which algorithm is best suited to detect a cycle in a directed graph representing ${company}'s network topology?`,
        options: ['Depth First Search (DFS) with a recursion stack or visited set', 'Breadth First Search (BFS) using a simple queue', "Dijkstra's Algorithm", "Kruskal's Algorithm"]
      },
      {
        text: `To reverse a linked list in-place to optimize memory usage in a ${company} mobile app, you need to:`,
        options: ['Iterate and reverse pointers using three variables (prev, current, next)', 'Copy all values to an array, reverse the array, and create a new list', 'Use a stack to pop all elements into a new list', 'Use a recursive function that duplicates each node']
      },
      {
        text: `When finding the longest palindromic substring in a string for ${company}'s text processing, what technique optimally avoids O(N^3) complexity?`,
        options: ['Expand around the center for each character (O(N^2))', 'Checking every possible substring and reversing it', 'Sorting the string alphabetically first', 'Using a regular expression match']
      },
      {
        text: `For autocomplete functionality in ${company}'s search bar, a Trie data structure is chosen because:`,
        options: ['It allows fast O(L) prefix lookups where L is the length of the word', 'It compresses data better than any other structure', 'It automatically sorts the results alphabetically without traversing', 'It stores data in a completely flat array format']
      },
      {
        text: `To merge K sorted linked lists (simulating merging data feeds at ${company}) optimally, you should use:`,
        options: ['A Min-Heap (Priority Queue)', 'A standard Array and sort it using Quick Sort', 'A Hash Map', 'A simple while loop comparing the heads of all K lists sequentially']
      },
      {
        text: `To find the maximum depth of a binary tree for a ${company} analytics algorithm, the simplest recursive approach is:`,
        options: ['Return 1 + max(depth(left), depth(right))', 'Return depth(left) + depth(right)', 'Traverse the tree and store all nodes in an array', 'Use a breadth-first search and count the total number of nodes']
      },
      {
        text: `The "N-Queens" problem (placing N non-attacking queens on an NxN board) is a classic example of which algorithmic paradigm often used for resource allocation problems at ${company}?`,
        options: ['Backtracking', 'Greedy Algorithm', 'Dynamic Programming', 'Divide and Conquer']
      },
      {
        text: `To validate whether a given string has balanced parentheses for ${company}'s code editor component, the ideal data structure is:`,
        options: ['A Stack', 'A Queue', 'A Hash Set', 'A Binary Tree']
      }
    ];

    const data = codingData[index % codingData.length];
    return { id: index, text: data.text, options: [...data.options].sort(() => Math.random() - 0.5) };
  }

  if (t === 'technical') {
    const technicalData = [
      {
        text: `Which of the following data structures is best for implementing a priority queue at ${company}?`,
        options: ['Binary Heap', 'Linked List', 'Stack', 'Array']
      },
      {
        text: `In a microservices architecture for ${company}, what is the primary benefit of using an API Gateway?`,
        options: ['Centralized request routing and authentication', 'Faster database queries', 'Automatic frontend rendering', 'Direct service-to-service communication']
      },
      {
        text: `Which HTTP method should be used to update a user's profile information in ${company}'s REST API?`,
        options: ['PUT or PATCH', 'GET', 'POST', 'DELETE']
      },
      {
        text: `What is the primary purpose of indexing a database table in a ${company} application?`,
        options: ['To speed up data retrieval operations', 'To encrypt sensitive data', 'To compress the database size', 'To enforce foreign key constraints']
      },
      {
        text: `Which sorting algorithm provides the best average-case performance for sorting user data at ${company}?`,
        options: ['Quick Sort or Merge Sort', 'Bubble Sort', 'Insertion Sort', 'Selection Sort']
      },
      {
        text: `In object-oriented programming, what does polymorphism allow a ${company} developer to do?`,
        options: ['Treat objects of different classes through a common interface', 'Hide internal state from the outside world', 'Inherit properties from multiple parent classes', 'Restrict access to class variables']
      },
      {
        text: `Which of the following is a key characteristic of stateless applications deployed at ${company}?`,
        options: ['They do not store client session data on the server between requests', 'They require a persistent connection to the database', 'They are impossible to scale horizontally', 'They store all user data in local memory']
      }
    ];
    
    const data = technicalData[index % technicalData.length];
    return { id: index, text: data.text, options: [...data.options].sort(() => Math.random() - 0.5) };
  }

  if (t === 'system_design') {
    const designData = [
      {
        text: `When designing a scalable notification system for ${company} that handles millions of users, how do you decouple the request ingestion from the actual delivery?`,
        options: ['Use a message queue (e.g., Kafka or RabbitMQ) between the API and workers', 'Write directly to a SQL database and poll it every second', 'Make synchronous HTTP calls to the notification provider (e.g., APNS)', 'Store all notifications in local memory on a single server']
      },
      {
        text: `What strategy would you use to shard a massive database for ${company}'s global user base to ensure even distribution?`,
        options: ['Consistent Hashing based on User ID', 'Sharding by alphabetical order of usernames', 'Storing all data in one massive table with indexing', 'Sharding purely by the timestamp of account creation']
      },
      {
        text: `To implement rate limiting for ${company}'s public API, which algorithm is commonly used and supported by Redis?`,
        options: ['Token Bucket or Leaky Bucket', 'Round Robin', 'Least Connections', 'Binary Search']
      },
      {
        text: `In a URL shortener service for ${company}, how would you generate the short alias?`,
        options: ['Base62 encoding of a unique auto-incrementing ID', 'Hashing the long URL with MD5 and using the whole hash', 'Using a random number generator without checking for collisions', 'Storing the long URL directly as the short URL']
      },
      {
        text: `How would you handle eventual consistency in a distributed database at ${company}?`,
        options: ['Design the application to tolerate stale data and resolve conflicts on read/write', 'Enforce strict ACID transactions across all global nodes for every write', 'Only allow one server in the world to handle all writes and reads', 'Ignore consistency entirely and just serve whatever data is available']
      },
      {
        text: `For a real-time chat application for ${company}, which protocol is best for pushing messages from the server to the client?`,
        options: ['WebSockets', 'Standard HTTP GET requests (polling)', 'FTP', 'SMTP']
      },
      {
        text: `What caching strategy would you employ to reduce database load for frequently accessed, slow-changing data in ${company}'s web app?`,
        options: ['Cache-aside (lazy loading) with Redis or Memcached', 'Write-through caching directly to disk storage', 'Caching the data on the client side only', 'Storing the cache in a separate SQL database']
      },
      {
        text: `To design a highly available logging and monitoring system for ${company}, a standard tech stack would be:`,
        options: ['ELK Stack (Elasticsearch, Logstash, Kibana) or Prometheus/Grafana', 'A single flat text file on the application server', 'A standard relational database table', 'Sending all logs directly to developer emails']
      },
      {
        text: `To implement a distributed lock manager in a ${company} microservices environment, you could use:`,
        options: ['Redis (using SETNX or Redlock) or ZooKeeper', 'A global boolean variable in the API Gateway', 'A standard SQL UPDATE statement without transactions', 'Local memory of a single microservice instance']
      },
      {
        text: `To process and analyze massive amounts of streaming data for ${company}, you would likely use:`,
        options: ['Apache Kafka for ingestion and Apache Flink/Spark for processing', 'A simple cron job running a Python script every hour', 'Storing everything in a CSV file and opening it in Excel', 'A single monolithic Node.js application']
      }
    ];
    
    const data = designData[index % designData.length];
    return { id: index, text: data.text, options: [...data.options].sort(() => Math.random() - 0.5) };
  }

  // Default to HR / Behavioral
  const hrData = [
    {
      text: `If you disagreed with a colleague on a technical approach for a ${company} project, how should you resolve it?`,
      options: ['Discuss the trade-offs objectively and align on what serves the project goals best', 'Implement your approach anyway because you know it is better', 'Escalate immediately to the manager without talking to the colleague', 'Give in to avoid conflict, even if their approach is flawed']
    },
    {
      text: `When facing a tight deadline on a critical ${company} feature, the best approach is to:`,
      options: ['Prioritize the core MVP requirements, communicate risks, and deliver a working solution', 'Work 24/7 without sleep until it is perfectly polished', 'Hide the progress and hope to finish on time', 'Push the deadline back immediately without trying to scope down']
    },
    {
      text: `Which response best demonstrates why you are interested in joining ${company}?`,
      options: ['Connecting your past experiences and passions directly to the company’s mission and culture', 'Stating that you just need a job right now', 'Focusing entirely on the compensation and benefits package', 'Saying you apply to every tech company you see']
    },
    {
      text: `If a project you led at ${company} fails, what is the most constructive response?`,
      options: ['Take ownership, run a blameless post-mortem, and apply learnings to the next project', 'Find a way to blame external factors or other teams', 'Pretend it was actually a success', 'Quit the project and move to a different team']
    },
    {
      text: `When dealing with multiple urgent requests from stakeholders at ${company}, you should:`,
      options: ['Communicate with stakeholders to evaluate impact/urgency and prioritize accordingly', 'Try to do everything at once by multitasking', 'Only work on the request from the most senior person', 'Ignore the requests until you finish your current task']
    },
    {
      text: `Going above and beyond to deliver a high-quality product reflects ${company}'s culture of:`,
      options: ['Customer obsession and ownership', 'Working long hours for the sake of it', 'Ignoring the original requirements', 'Micromanaging the team']
    },
    {
      text: `If you have to learn a new technology quickly for ${company}'s tech stack, you would:`,
      options: ['Read the official docs, build a small prototype, and ask peers targeted questions', 'Refuse the task because it is not in your current skillset', 'Spend a month taking theoretical courses before writing code', 'Copy-paste code from the internet until it works']
    },
    {
      text: `When receiving constructive criticism from a manager at ${company}, you should:`,
      options: ['Listen actively, ask clarifying questions, and make actionable improvements', 'Get defensive and explain why they are wrong', 'Agree verbally but change nothing in your behavior', 'Complain to your coworkers about the manager']
    },
    {
      text: `If a project's requirements change significantly mid-way through development at ${company}, you should:`,
      options: ['Evaluate the impact, adjust the timeline, and remain agile to meet the new needs', 'Refuse to implement the changes because development has already started', 'Panic and start the entire project from scratch', 'Continue with the old requirements and ignore the update']
    },
    {
      text: `When mentoring a junior team member at ${company}, the most effective approach is to:`,
      options: ['Provide guidance, pair program, and empower them to solve problems independently', 'Do their work for them so it gets done faster', 'Give them the hardest tasks and see if they survive', 'Ignore them so they learn to be self-sufficient']
    }
  ];

  const data = hrData[index % hrData.length];
  return { id: index, text: data.text, options: [...data.options].sort(() => Math.random() - 0.5) };
};

export const getCodingQuestionsForSession = (companyName: string): MockCodingQuestion[] => {
  const company = companyName || 'the company';
  
  const easyMediums: MockCodingQuestion[] = [
    {
      id: 1,
      title: 'Two Sum',
      problemStatement: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. This is a common warm-up for ${company} interviews.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]`,
      starterCode: {
        javascript: `function twoSum(nums, target) {\n  // Write your code here\n  \n}\n\n// --- Test Case ---\n// console.log("Output:", twoSum([2,7,11,15], 9));\n`,
        python: `def twoSum(nums, target):\n    # Write your code here\n    pass\n\n# --- Test Case ---\n# print("Output:", twoSum([2,7,11,15], 9))\n`,
        java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        // --- Test Case ---\n        // System.out.println("Output: " + java.util.Arrays.toString(new Solution().twoSum(new int[]{2,7,11,15}, 9)));\n    }\n}`
      },
      difficulty: 'Easy/Medium'
    },
    {
      id: 2,
      title: 'Valid Parentheses',
      problemStatement: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if open brackets are closed by the same type of brackets and in the correct order. Often used by ${company} for basic parsing validation.\n\nExample:\nInput: s = "()[]{}"\nOutput: true`,
      starterCode: {
        javascript: `function isValid(s) {\n  // Write your code here\n  \n}\n\n// --- Test Case ---\n// console.log("Output:", isValid("()[]{}"));\n`,
        python: `def isValid(s):\n    # Write your code here\n    pass\n\n# --- Test Case ---\n# print("Output:", isValid("()[]{}"))\n`,
        java: `class Solution {\n    public boolean isValid(String s) {\n        // Write your code here\n        return false;\n    }\n\n    public static void main(String[] args) {\n        // --- Test Case ---\n        // System.out.println("Output: " + new Solution().isValid("()[]{}"));\n    }\n}`
      },
      difficulty: 'Easy/Medium'
    }
  ];

  const advanceds: MockCodingQuestion[] = [
    {
      id: 3,
      title: 'Merge K Sorted Lists',
      problemStatement: `You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it. This simulates merging distributed data feeds, a common problem at ${company}.\n\nExample:\nInput: lists = [[1,4,5],[1,3,4],[2,6]]\nOutput: [1,1,2,3,4,4,5,6]`,
      starterCode: {
        javascript: `/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\nfunction mergeKLists(lists) {\n  // Write your code here\n  \n}\n\n// --- Test Case ---\n// console.log("Output:", mergeKLists([]));\n`,
        python: `# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\ndef mergeKLists(lists):\n    # Write your code here\n    pass\n\n# --- Test Case ---\n# print("Output:", mergeKLists([]))\n`,
        java: `/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        // Write your code here\n        return null;\n    }\n\n    public static void main(String[] args) {\n        // --- Test Case ---\n        // System.out.println("Output: " + new Solution().mergeKLists(new ListNode[]{}));\n    }\n}`
      },
      difficulty: 'Advanced'
    },
    {
      id: 4,
      title: 'Longest Palindromic Substring',
      problemStatement: `Given a string s, return the longest palindromic substring in s.\n\nA string is palindromic if it reads the same forward and backward. Optimizing this beyond O(N^3) is a standard ${company} system design precursor.\n\nExample:\nInput: s = "babad"\nOutput: "bab" (or "aba")`,
      starterCode: {
        javascript: `function longestPalindrome(s) {\n  // Write your code here\n  \n}\n\n// --- Test Case ---\n// console.log("Output:", longestPalindrome("babad"));\n`,
        python: `def longestPalindrome(s):\n    # Write your code here\n    pass\n\n# --- Test Case ---\n# print("Output:", longestPalindrome("babad"))\n`,
        java: `class Solution {\n    public String longestPalindrome(String s) {\n        // Write your code here\n        return "";\n    }\n\n    public static void main(String[] args) {\n        // --- Test Case ---\n        // System.out.println("Output: " + new Solution().longestPalindrome("babad"));\n    }\n}`
      },
      difficulty: 'Advanced'
    }
  ];

  // Return exactly 1 easy/medium and 1 advanced
  return [
    easyMediums[Math.floor(Math.random() * easyMediums.length)],
    advanceds[Math.floor(Math.random() * advanceds.length)]
  ];
};
