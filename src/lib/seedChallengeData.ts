/**
 * SmartHire — Rich Challenge Seed Data
 * 7 challenge days × 2-3 problems each, covering core DSA topics.
 * All 5 languages have starter code.
 */

import { db } from './firebase';
import { collection, addDoc, getDocs, query, writeBatch } from 'firebase/firestore';

interface SeedProblem {
  title: string;
  statement: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  topicTags: string[];
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCode: Record<string, string>;
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
}

interface SeedDay {
  dayNumber: number;
  theme: string;
  problems: SeedProblem[];
}

const SEED_DAYS: SeedDay[] = [
  {
    dayNumber: 1,
    theme: 'Arrays & Two Pointers',
    problems: [
      {
        title: 'Two Sum',
        statement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
        difficulty: 'easy',
        points: 100,
        topicTags: ['Arrays', 'Hash Map'],
        examples: [
          { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9' },
          { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
        ],
        constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
        starterCode: {
          python: 'def twoSum(nums, target):\n    # Your code here\n    pass',
          javascript: 'function twoSum(nums, target) {\n    // Your code here\n}',
          java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{};\n    }\n}',
          cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your code here\n    }\n};',
          c: '#include <stdlib.h>\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    *returnSize = 2;\n    int* result = (int*)malloc(2 * sizeof(int));\n    // Your code here\n    return result;\n}'
        },
        testCases: [
          { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false },
          { input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: false },
          { input: '[3,3]\n6', expectedOutput: '[0,1]', isHidden: true }
        ]
      },
      {
        title: 'Container With Most Water',
        statement: 'You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the i-th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.',
        difficulty: 'medium',
        points: 250,
        topicTags: ['Arrays', 'Two Pointers'],
        examples: [
          { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: 'Lines at index 1 and 8 form the container with most water' },
        ],
        constraints: ['2 <= height.length <= 10^5', '0 <= height[i] <= 10^4'],
        starterCode: {
          python: 'def maxArea(height):\n    # Your code here\n    pass',
          javascript: 'function maxArea(height) {\n    // Your code here\n}',
          java: 'class Solution {\n    public int maxArea(int[] height) {\n        // Your code here\n        return 0;\n    }\n}',
          cpp: 'class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // Your code here\n    }\n};',
          c: 'int maxArea(int* height, int heightSize) {\n    // Your code here\n    return 0;\n}'
        },
        testCases: [
          { input: '[1,8,6,2,5,4,8,3,7]', expectedOutput: '49', isHidden: false },
          { input: '[1,1]', expectedOutput: '1', isHidden: false },
          { input: '[4,3,2,1,4]', expectedOutput: '16', isHidden: true }
        ]
      },
    ]
  },
  {
    dayNumber: 2,
    theme: 'Strings & Hashing',
    problems: [
      {
        title: 'Valid Anagram',
        statement: 'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn anagram is a word formed by rearranging the letters of a different word, using all the original letters exactly once.',
        difficulty: 'easy',
        points: 100,
        topicTags: ['Strings', 'Hash Map'],
        examples: [
          { input: 's = "anagram", t = "nagaram"', output: 'true' },
          { input: 's = "rat", t = "car"', output: 'false' }
        ],
        constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters'],
        starterCode: {
          python: 'def isAnagram(s, t):\n    # Your code here\n    pass',
          javascript: 'function isAnagram(s, t) {\n    // Your code here\n}',
          java: 'class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Your code here\n        return false;\n    }\n}',
          cpp: 'class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // Your code here\n    }\n};',
          c: '#include <stdbool.h>\nbool isAnagram(char* s, char* t) {\n    // Your code here\n    return false;\n}'
        },
        testCases: [
          { input: 'anagram\nnagaram', expectedOutput: 'true', isHidden: false },
          { input: 'rat\ncar', expectedOutput: 'false', isHidden: false },
          { input: 'ab\na', expectedOutput: 'false', isHidden: true }
        ]
      },
      {
        title: 'Group Anagrams',
        statement: 'Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.',
        difficulty: 'medium',
        points: 250,
        topicTags: ['Strings', 'Hash Map', 'Sorting'],
        examples: [
          { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' },
        ],
        constraints: ['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100'],
        starterCode: {
          python: 'def groupAnagrams(strs):\n    # Your code here\n    pass',
          javascript: 'function groupAnagrams(strs) {\n    // Your code here\n}',
          java: 'class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Your code here\n        return new ArrayList<>();\n    }\n}',
          cpp: 'class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        // Your code here\n    }\n};',
          c: '// Note: C does not natively support complex return types\n// Implement with arrays and manual grouping\nvoid groupAnagrams(char** strs, int strsSize) {\n    // Your code here\n}'
        },
        testCases: [
          { input: '["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]', isHidden: false },
          { input: '[""]', expectedOutput: '[[""]]', isHidden: true }
        ]
      },
    ]
  },
  {
    dayNumber: 3,
    theme: 'Linked Lists',
    problems: [
      {
        title: 'Reverse Linked List',
        statement: 'Given the `head` of a singly linked list, reverse the list, and return the reversed list.',
        difficulty: 'easy',
        points: 100,
        topicTags: ['Linked List', 'Recursion'],
        examples: [
          { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
          { input: 'head = [1,2]', output: '[2,1]' }
        ],
        constraints: ['0 <= number of nodes <= 5000', '-5000 <= Node.val <= 5000'],
        starterCode: {
          python: 'def reverseList(head):\n    # Your code here\n    pass',
          javascript: 'function reverseList(head) {\n    // Your code here\n}',
          java: 'class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Your code here\n        return null;\n    }\n}',
          cpp: 'class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Your code here\n    }\n};',
          c: 'struct ListNode* reverseList(struct ListNode* head) {\n    // Your code here\n    return NULL;\n}'
        },
        testCases: [
          { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
          { input: '[1,2]', expectedOutput: '[2,1]', isHidden: false },
          { input: '[]', expectedOutput: '[]', isHidden: true }
        ]
      },
      {
        title: 'Merge Two Sorted Lists',
        statement: 'You are given the heads of two sorted linked lists `list1` and `list2`. Merge the two lists into one sorted list by splicing together the nodes.',
        difficulty: 'easy',
        points: 100,
        topicTags: ['Linked List', 'Recursion'],
        examples: [
          { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' },
        ],
        constraints: ['0 <= number of nodes <= 50', '-100 <= Node.val <= 100'],
        starterCode: {
          python: 'def mergeTwoLists(list1, list2):\n    # Your code here\n    pass',
          javascript: 'function mergeTwoLists(list1, list2) {\n    // Your code here\n}',
          java: 'class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        // Your code here\n        return null;\n    }\n}',
          cpp: 'class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        // Your code here\n    }\n};',
          c: 'struct ListNode* mergeTwoLists(struct ListNode* list1, struct ListNode* list2) {\n    // Your code here\n    return NULL;\n}'
        },
        testCases: [
          { input: '[1,2,4]\n[1,3,4]', expectedOutput: '[1,1,2,3,4,4]', isHidden: false },
          { input: '[]\n[]', expectedOutput: '[]', isHidden: true }
        ]
      },
      {
        title: 'Detect Cycle in Linked List',
        statement: 'Given `head`, the head of a linked list, determine if the linked list has a cycle in it. Return `true` if there is a cycle, `false` otherwise.',
        difficulty: 'medium',
        points: 250,
        topicTags: ['Linked List', 'Two Pointers'],
        examples: [
          { input: 'head = [3,2,0,-4], pos = 1', output: 'true', explanation: 'Tail connects to node index 1' },
        ],
        constraints: ['0 <= number of nodes <= 10^4', '-10^5 <= Node.val <= 10^5'],
        starterCode: {
          python: 'def hasCycle(head):\n    # Your code here\n    pass',
          javascript: 'function hasCycle(head) {\n    // Your code here\n}',
          java: 'class Solution {\n    public boolean hasCycle(ListNode head) {\n        // Your code here\n        return false;\n    }\n}',
          cpp: 'class Solution {\npublic:\n    bool hasCycle(ListNode *head) {\n        // Your code here\n    }\n};',
          c: '#include <stdbool.h>\nbool hasCycle(struct ListNode *head) {\n    // Your code here\n    return false;\n}'
        },
        testCases: [
          { input: '[3,2,0,-4]\n1', expectedOutput: 'true', isHidden: false },
          { input: '[1,2]\n0', expectedOutput: 'true', isHidden: true },
          { input: '[1]\n-1', expectedOutput: 'false', isHidden: true }
        ]
      }
    ]
  },
  {
    dayNumber: 4,
    theme: 'Stacks & Queues',
    problems: [
      {
        title: 'Valid Parentheses',
        statement: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
        difficulty: 'easy',
        points: 100,
        topicTags: ['Stack', 'Strings'],
        examples: [
          { input: 's = "()"', output: 'true' },
          { input: 's = "()[]{}"', output: 'true' },
          { input: 's = "(]"', output: 'false' }
        ],
        constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only'],
        starterCode: {
          python: 'def isValid(s):\n    # Your code here\n    pass',
          javascript: 'function isValid(s) {\n    // Your code here\n}',
          java: 'class Solution {\n    public boolean isValid(String s) {\n        // Your code here\n        return false;\n    }\n}',
          cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n        // Your code here\n    }\n};',
          c: '#include <stdbool.h>\nbool isValid(char* s) {\n    // Your code here\n    return false;\n}'
        },
        testCases: [
          { input: '()', expectedOutput: 'true', isHidden: false },
          { input: '()[]{}', expectedOutput: 'true', isHidden: false },
          { input: '(]', expectedOutput: 'false', isHidden: false },
          { input: '([)]', expectedOutput: 'false', isHidden: true }
        ]
      },
      {
        title: 'Min Stack',
        statement: 'Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.\n\nImplement the `MinStack` class.',
        difficulty: 'medium',
        points: 250,
        topicTags: ['Stack', 'Design'],
        examples: [
          { input: '["MinStack","push","push","push","getMin","pop","top","getMin"]\n[[],[-2],[0],[-3],[],[],[],[]]', output: '[null,null,null,null,-3,null,0,-2]' },
        ],
        constraints: ['Methods pop, top and getMin will always be called on non-empty stacks', '-2^31 <= val <= 2^31 - 1'],
        starterCode: {
          python: 'class MinStack:\n    def __init__(self):\n        pass\n\n    def push(self, val):\n        pass\n\n    def pop(self):\n        pass\n\n    def top(self):\n        pass\n\n    def getMin(self):\n        pass',
          javascript: 'class MinStack {\n    constructor() {\n        // Your code here\n    }\n    push(val) {}\n    pop() {}\n    top() {}\n    getMin() {}\n}',
          java: 'class MinStack {\n    public MinStack() {\n    }\n    public void push(int val) {\n    }\n    public void pop() {\n    }\n    public int top() {\n        return 0;\n    }\n    public int getMin() {\n        return 0;\n    }\n}',
          cpp: 'class MinStack {\npublic:\n    MinStack() {}\n    void push(int val) {}\n    void pop() {}\n    int top() { return 0; }\n    int getMin() { return 0; }\n};',
          c: 'typedef struct {\n    // Your code here\n} MinStack;\n\nMinStack* minStackCreate() { return NULL; }\nvoid minStackPush(MinStack* obj, int val) {}\nvoid minStackPop(MinStack* obj) {}\nint minStackTop(MinStack* obj) { return 0; }\nint minStackGetMin(MinStack* obj) { return 0; }'
        },
        testCases: [
          { input: 'push(-2)\npush(0)\npush(-3)\ngetMin\npop\ntop\ngetMin', expectedOutput: '-3\n0\n-2', isHidden: false },
        ]
      }
    ]
  },
  {
    dayNumber: 5,
    theme: 'Binary Trees',
    problems: [
      {
        title: 'Maximum Depth of Binary Tree',
        statement: 'Given the `root` of a binary tree, return its maximum depth.\n\nA binary tree\'s maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.',
        difficulty: 'easy',
        points: 100,
        topicTags: ['Trees', 'DFS', 'Recursion'],
        examples: [
          { input: 'root = [3,9,20,null,null,15,7]', output: '3' },
          { input: 'root = [1,null,2]', output: '2' }
        ],
        constraints: ['0 <= number of nodes <= 10^4'],
        starterCode: {
          python: 'def maxDepth(root):\n    # Your code here\n    pass',
          javascript: 'function maxDepth(root) {\n    // Your code here\n}',
          java: 'class Solution {\n    public int maxDepth(TreeNode root) {\n        // Your code here\n        return 0;\n    }\n}',
          cpp: 'class Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        // Your code here\n    }\n};',
          c: 'int maxDepth(struct TreeNode* root) {\n    // Your code here\n    return 0;\n}'
        },
        testCases: [
          { input: '[3,9,20,null,null,15,7]', expectedOutput: '3', isHidden: false },
          { input: '[1,null,2]', expectedOutput: '2', isHidden: false },
          { input: '[]', expectedOutput: '0', isHidden: true }
        ]
      },
      {
        title: 'Validate Binary Search Tree',
        statement: 'Given the `root` of a binary tree, determine if it is a valid binary search tree (BST).',
        difficulty: 'medium',
        points: 250,
        topicTags: ['Trees', 'DFS', 'BST'],
        examples: [
          { input: 'root = [2,1,3]', output: 'true' },
          { input: 'root = [5,1,4,null,null,3,6]', output: 'false' }
        ],
        constraints: ['1 <= number of nodes <= 10^4'],
        starterCode: {
          python: 'def isValidBST(root):\n    # Your code here\n    pass',
          javascript: 'function isValidBST(root) {\n    // Your code here\n}',
          java: 'class Solution {\n    public boolean isValidBST(TreeNode root) {\n        // Your code here\n        return false;\n    }\n}',
          cpp: 'class Solution {\npublic:\n    bool isValidBST(TreeNode* root) {\n        // Your code here\n    }\n};',
          c: '#include <stdbool.h>\nbool isValidBST(struct TreeNode* root) {\n    // Your code here\n    return false;\n}'
        },
        testCases: [
          { input: '[2,1,3]', expectedOutput: 'true', isHidden: false },
          { input: '[5,1,4,null,null,3,6]', expectedOutput: 'false', isHidden: false },
        ]
      }
    ]
  },
  {
    dayNumber: 6,
    theme: 'Dynamic Programming',
    problems: [
      {
        title: 'Climbing Stairs',
        statement: 'You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
        difficulty: 'easy',
        points: 100,
        topicTags: ['Dynamic Programming', 'Math'],
        examples: [
          { input: 'n = 2', output: '2', explanation: '1+1 or 2' },
          { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1' }
        ],
        constraints: ['1 <= n <= 45'],
        starterCode: {
          python: 'def climbStairs(n):\n    # Your code here\n    pass',
          javascript: 'function climbStairs(n) {\n    // Your code here\n}',
          java: 'class Solution {\n    public int climbStairs(int n) {\n        // Your code here\n        return 0;\n    }\n}',
          cpp: 'class Solution {\npublic:\n    int climbStairs(int n) {\n        // Your code here\n    }\n};',
          c: 'int climbStairs(int n) {\n    // Your code here\n    return 0;\n}'
        },
        testCases: [
          { input: '2', expectedOutput: '2', isHidden: false },
          { input: '3', expectedOutput: '3', isHidden: false },
          { input: '5', expectedOutput: '8', isHidden: true }
        ]
      },
      {
        title: 'Longest Increasing Subsequence',
        statement: 'Given an integer array `nums`, return the length of the longest strictly increasing subsequence.',
        difficulty: 'medium',
        points: 250,
        topicTags: ['Dynamic Programming', 'Binary Search'],
        examples: [
          { input: 'nums = [10,9,2,5,3,7,101,18]', output: '4', explanation: '[2,3,7,101]' },
        ],
        constraints: ['1 <= nums.length <= 2500', '-10^4 <= nums[i] <= 10^4'],
        starterCode: {
          python: 'def lengthOfLIS(nums):\n    # Your code here\n    pass',
          javascript: 'function lengthOfLIS(nums) {\n    // Your code here\n}',
          java: 'class Solution {\n    public int lengthOfLIS(int[] nums) {\n        // Your code here\n        return 0;\n    }\n}',
          cpp: 'class Solution {\npublic:\n    int lengthOfLIS(vector<int>& nums) {\n        // Your code here\n    }\n};',
          c: 'int lengthOfLIS(int* nums, int numsSize) {\n    // Your code here\n    return 0;\n}'
        },
        testCases: [
          { input: '[10,9,2,5,3,7,101,18]', expectedOutput: '4', isHidden: false },
          { input: '[0,1,0,3,2,3]', expectedOutput: '4', isHidden: false },
          { input: '[7,7,7,7]', expectedOutput: '1', isHidden: true }
        ]
      },
      {
        title: 'Coin Change',
        statement: 'You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount cannot be made up, return `-1`.',
        difficulty: 'hard',
        points: 500,
        topicTags: ['Dynamic Programming', 'BFS'],
        examples: [
          { input: 'coins = [1,5,11], amount = 15', output: '3', explanation: '5 + 5 + 5' },
        ],
        constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
        starterCode: {
          python: 'def coinChange(coins, amount):\n    # Your code here\n    pass',
          javascript: 'function coinChange(coins, amount) {\n    // Your code here\n}',
          java: 'class Solution {\n    public int coinChange(int[] coins, int amount) {\n        // Your code here\n        return -1;\n    }\n}',
          cpp: 'class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        // Your code here\n    }\n};',
          c: 'int coinChange(int* coins, int coinsSize, int amount) {\n    // Your code here\n    return -1;\n}'
        },
        testCases: [
          { input: '[1,5,11]\n15', expectedOutput: '3', isHidden: false },
          { input: '[2]\n3', expectedOutput: '-1', isHidden: false },
          { input: '[1]\n0', expectedOutput: '0', isHidden: true }
        ]
      }
    ]
  },
  {
    dayNumber: 7,
    theme: 'Graphs & BFS/DFS',
    problems: [
      {
        title: 'Number of Islands',
        statement: 'Given an `m x n` 2D binary grid `grid` which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
        difficulty: 'medium',
        points: 250,
        topicTags: ['Graphs', 'BFS', 'DFS', 'Matrix'],
        examples: [
          { input: 'grid = [\n  ["1","1","1","1","0"],\n  ["1","1","0","1","0"],\n  ["1","1","0","0","0"],\n  ["0","0","0","0","0"]\n]', output: '1' },
        ],
        constraints: ['1 <= m, n <= 300', 'grid[i][j] is "0" or "1"'],
        starterCode: {
          python: 'def numIslands(grid):\n    # Your code here\n    pass',
          javascript: 'function numIslands(grid) {\n    // Your code here\n}',
          java: 'class Solution {\n    public int numIslands(char[][] grid) {\n        // Your code here\n        return 0;\n    }\n}',
          cpp: 'class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        // Your code here\n    }\n};',
          c: 'int numIslands(char** grid, int gridSize, int* gridColSize) {\n    // Your code here\n    return 0;\n}'
        },
        testCases: [
          { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: '1', isHidden: false },
          { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: '3', isHidden: false },
        ]
      },
      {
        title: 'Word Ladder',
        statement: 'Given two words, `beginWord` and `endWord`, and a dictionary `wordList`, return the number of words in the shortest transformation sequence from `beginWord` to `endWord`, or 0 if no such sequence exists.\n\nOnly one letter can be changed at a time, and each transformed word must exist in the word list.',
        difficulty: 'hard',
        points: 500,
        topicTags: ['Graphs', 'BFS', 'Strings'],
        examples: [
          { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: '5', explanation: '"hit" -> "hot" -> "dot" -> "dog" -> "cog"' },
        ],
        constraints: ['1 <= beginWord.length <= 10', 'endWord.length == beginWord.length', '1 <= wordList.length <= 5000'],
        starterCode: {
          python: 'def ladderLength(beginWord, endWord, wordList):\n    # Your code here\n    pass',
          javascript: 'function ladderLength(beginWord, endWord, wordList) {\n    // Your code here\n}',
          java: 'class Solution {\n    public int ladderLength(String beginWord, String endWord, List<String> wordList) {\n        // Your code here\n        return 0;\n    }\n}',
          cpp: 'class Solution {\npublic:\n    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {\n        // Your code here\n    }\n};',
          c: 'int ladderLength(char* beginWord, char* endWord, char** wordList, int wordListSize) {\n    // Your code here\n    return 0;\n}'
        },
        testCases: [
          { input: 'hit\ncog\n["hot","dot","dog","lot","log","cog"]', expectedOutput: '5', isHidden: false },
          { input: 'hit\ncog\n["hot","dot","dog","lot","log"]', expectedOutput: '0', isHidden: true }
        ]
      }
    ]
  },
];

/**
 * Seeds Firestore with 7 challenge days and ~17 problems.
 * Checks for existing data first to avoid duplicates.
 */
export async function seedRichChallengeData(): Promise<{ days: number; problems: number }> {
  // Check if data already exists
  const existing = await getDocs(query(collection(db, 'challengeDays')));
  if (!existing.empty) {
    return { days: existing.size, problems: 0 };
  }

  let totalProblems = 0;
  const today = new Date();

  for (const day of SEED_DAYS) {
    const releaseDate = new Date(today);
    releaseDate.setDate(releaseDate.getDate() - (SEED_DAYS.length - day.dayNumber));
    const releaseDateStr = releaseDate.toISOString().split('T')[0];

    const dayRef = await addDoc(collection(db, 'challengeDays'), {
      dayNumber: day.dayNumber,
      theme: day.theme,
      releaseDate: releaseDateStr,
    });

    for (const problem of day.problems) {
      await addDoc(collection(db, 'problems'), {
        ...problem,
        challengeDayId: dayRef.id,
      });
      totalProblems++;
    }
  }

  return { days: SEED_DAYS.length, problems: totalProblems };
}
