export interface DriverConfig {
  python?: string;
  javascript?: string;
  java?: string;
  cpp?: string;
  c?: string;
}

export const DRIVER_MAP: Record<string, DriverConfig> = {
  "Two Sum": {
    python: `
import sys, json
if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if len(lines) >= 2:
        nums = json.loads(lines[0])
        target = int(lines[1])
        if 'Solution' in globals():
            s = Solution()
            if hasattr(s, 'twoSum'): result = s.twoSum(nums, target)
            else: result = s.two_sum(nums, target)
        else:
            if 'twoSum' in globals(): result = twoSum(nums, target)
            else: result = two_sum(nums, target)
        print(json.dumps(result))
`,
    javascript: `
const fs = require('fs');
const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (lines.length >= 2) {
    const nums = JSON.parse(lines[0]);
    const target = parseInt(lines[1]);
    console.log(JSON.stringify(twoSum(nums, target)));
}
`,
    java: `
    public static void main(String[] args) throws Exception {
        java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String line1 = br.readLine();
        String line2 = br.readLine();
        if (line1 != null && line2 != null) {
            line1 = line1.trim();
            if (line1.startsWith("[")) line1 = line1.substring(1);
            if (line1.endsWith("]")) line1 = line1.substring(0, line1.length() - 1);
            String[] parts = line1.split(",");
            int[] nums = new int[parts.length];
            for (int i = 0; i < parts.length; i++) {
                nums[i] = Integer.parseInt(parts[i].trim());
            }
            int target = Integer.parseInt(line2.trim());
            int[] res = new Solution().twoSum(nums, target);
            System.out.println("[" + res[0] + "," + res[1] + "]");
        }
    }
`,
    cpp: `
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
using namespace std;
int main() {
    string line1, line2;
    if (getline(cin, line1) && getline(cin, line2)) {
        if (line1.front() == '[') line1 = line1.substr(1);
        if (line1.back() == ']') line1 = line1.substr(0, line1.length() - 1);
        stringstream ss(line1);
        string token;
        vector<int> nums;
        while (getline(ss, token, ',')) {
            nums.push_back(stoi(token));
        }
        int target = stoi(line2);
        vector<int> res = Solution().twoSum(nums, target);
        cout << "[" << res[0] << "," << res[1] << "]" << endl;
    }
    return 0;
}
`,
    c: `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    char line1[1000], line2[100];
    if (fgets(line1, sizeof(line1), stdin) && fgets(line2, sizeof(line2), stdin)) {
        char* start = strchr(line1, '[');
        char* end = strchr(line1, ']');
        if (start && end) {
            *end = '\\0';
            start++;
            int nums[1000];
            int size = 0;
            char* token = strtok(start, ",");
            while (token) {
                nums[size++] = atoi(token);
                token = strtok(NULL, ",");
            }
            int target = atoi(line2);
            int returnSize = 0;
            int* res = twoSum(nums, size, target, &returnSize);
            printf("[%d,%d]\\n", res[0], res[1]);
            free(res);
        }
    }
    return 0;
}
`
  },
  "Container With Most Water": {
    python: `
import sys, json
if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if lines:
        height = json.loads(lines[0])
        print(maxArea(height))
`,
    javascript: `
const fs = require('fs');
const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (lines.length >= 1 && lines[0]) {
    const height = JSON.parse(lines[0]);
    console.log(maxArea(height));
}
`,
    java: `
    public static void main(String[] args) throws Exception {
        java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String line = br.readLine();
        if (line != null) {
            line = line.trim();
            if (line.startsWith("[")) line = line.substring(1);
            if (line.endsWith("]")) line = line.substring(0, line.length() - 1);
            String[] parts = line.split(",");
            int[] height = new int[parts.length];
            for (int i = 0; i < parts.length; i++) {
                height[i] = Integer.parseInt(parts[i].trim());
            }
            System.out.println(new Solution().maxArea(height));
        }
    }
`,
    cpp: `
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
using namespace std;
int main() {
    string line;
    if (getline(cin, line)) {
        if (line.front() == '[') line = line.substr(1);
        if (line.back() == ']') line = line.substr(0, line.length() - 1);
        stringstream ss(line);
        string token;
        vector<int> height;
        while (getline(ss, token, ',')) {
            height.push_back(stoi(token));
        }
        cout << Solution().maxArea(height) << endl;
    }
    return 0;
}
`,
    c: `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    char line[1000];
    if (fgets(line, sizeof(line), stdin)) {
        char* start = strchr(line, '[');
        char* end = strchr(line, ']');
        if (start && end) {
            *end = '\\0';
            start++;
            int height[1000];
            int size = 0;
            char* token = strtok(start, ",");
            while (token) {
                height[size++] = atoi(token);
                token = strtok(NULL, ",");
            }
            printf("%d\\n", maxArea(height, size));
        }
    }
    return 0;
}
`
  },
  "Valid Anagram": {
    python: `
import sys
if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if len(lines) >= 2:
        print(str(isAnagram(lines[0], lines[1])).lower())
`,
    javascript: `
const fs = require('fs');
const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (lines.length >= 2) {
    console.log(isAnagram(lines[0], lines[1]));
}
`,
    java: `
    public static void main(String[] args) throws Exception {
        java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String s = br.readLine();
        String t = br.readLine();
        if (s != null && t != null) {
            System.out.println(new Solution().isAnagram(s.trim(), t.trim()));
        }
    }
`,
    cpp: `
#include <iostream>
#include <string>
using namespace std;
int main() {
    string s, t;
    if (getline(cin, s) && getline(cin, t)) {
        cout << (Solution().isAnagram(s, t) ? "true" : "false") << endl;
    }
    return 0;
}
`,
    c: `
#include <stdio.h>
#include <stdbool.h>
#include <string.h>
int main() {
    char s[1000], t[1000];
    if (fgets(s, sizeof(s), stdin) && fgets(t, sizeof(t), stdin)) {
        s[strcspn(s, "\\r\\n")] = 0;
        t[strcspn(t, "\\r\\n")] = 0;
        printf("%s\\n", isAnagram(s, t) ? "true" : "false");
    }
    return 0;
}
`
  },
  "Group Anagrams": {
    python: `
import sys, json
if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if lines:
        strs = json.loads(lines[0])
        res = groupAnagrams(strs)
        res = sorted([sorted(g) for g in res])
        print(json.dumps(res))
`,
    javascript: `
const fs = require('fs');
const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (lines.length >= 1 && lines[0]) {
    const strs = JSON.parse(lines[0]);
    const res = groupAnagrams(strs);
    res.forEach(g => g.sort());
    res.sort((a, b) => a.join(',').localeCompare(b.join(',')));
    console.log(JSON.stringify(res));
}
`,
    java: `
    public static void main(String[] args) throws Exception {
        java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String line = br.readLine();
        if (line != null) {
            line = line.trim();
            if (line.startsWith("[")) line = line.substring(1);
            if (line.endsWith("]")) line = line.substring(0, line.length() - 1);
            String[] parts = line.split(",");
            String[] strs = new String[parts.length];
            for (int i = 0; i < parts.length; i++) {
                String p = parts[i].trim();
                if (p.startsWith("\\"")) p = p.substring(1);
                if (p.endsWith("\\"")) p = p.substring(0, p.length() - 1);
                strs[i] = p;
            }
            List<List<String>> res = new Solution().groupAnagrams(strs);
            for (List<String> g : res) {
                Collections.sort(g);
            }
            res.sort((a, b) -> String.join(",", a).compareTo(String.join(",", b)));
            StringBuilder sb = new StringBuilder();
            sb.append("[");
            for (int i = 0; i < res.size(); i++) {
                sb.append("[");
                List<String> g = res.get(i);
                for (int j = 0; j < g.size(); j++) {
                    sb.append("\\"").append(g.get(j)).append("\\"");
                    if (j < g.size() - 1) sb.append(",");
                }
                sb.append("]");
                if (i < res.size() - 1) sb.append(",");
            }
            sb.append("]");
            System.out.println(sb.toString());
        }
    }
`
  },
  "Valid Parentheses": {
    python: `
import sys
if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if lines:
        print(str(isValid(lines[0])).lower())
`,
    javascript: `
const fs = require('fs');
const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (lines.length >= 1 && lines[0]) {
    console.log(isValid(lines[0].trim()));
}
`,
    java: `
    public static void main(String[] args) throws Exception {
        java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String s = br.readLine();
        if (s != null) {
            System.out.println(new Solution().isValid(s.trim()));
        }
    }
`,
    cpp: `
#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    if (getline(cin, s)) {
        cout << (Solution().isValid(s) ? "true" : "false") << endl;
    }
    return 0;
}
`,
    c: `
#include <stdio.h>
#include <stdbool.h>
#include <string.h>
int main() {
    char s[10000];
    if (fgets(s, sizeof(s), stdin)) {
        s[strcspn(s, "\\r\\n")] = 0;
        printf("%s\\n", isValid(s) ? "true" : "false");
    }
    return 0;
}
`
  },
  "Climbing Stairs": {
    python: `
import sys
if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if lines:
        print(climbStairs(int(lines[0])))
`,
    javascript: `
const fs = require('fs');
const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (lines.length >= 1 && lines[0]) {
    console.log(climbStairs(parseInt(lines[0])));
}
`,
    java: `
    public static void main(String[] args) throws Exception {
        java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String s = br.readLine();
        if (s != null) {
            System.out.println(new Solution().climbStairs(Integer.parseInt(s.trim())));
        }
    }
`,
    cpp: `
#include <iostream>
using namespace std;
int main() {
    int n;
    if (cin >> n) {
        cout << Solution().climbStairs(n) << endl;
    }
    return 0;
}
`,
    c: `
#include <stdio.h>
int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        printf("%d\\n", climbStairs(n));
    }
    return 0;
}
`
  },
  "Longest Increasing Subsequence": {
    python: `
import sys, json
if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if lines:
        print(lengthOfLIS(json.loads(lines[0])))
`,
    javascript: `
const fs = require('fs');
const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (lines.length >= 1 && lines[0]) {
    console.log(lengthOfLIS(JSON.parse(lines[0])));
}
`,
    java: `
    public static void main(String[] args) throws Exception {
        java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String line = br.readLine();
        if (line != null) {
            line = line.trim();
            if (line.startsWith("[")) line = line.substring(1);
            if (line.endsWith("]")) line = line.substring(0, line.length() - 1);
            String[] parts = line.split(",");
            int[] nums = new int[parts.length];
            for (int i = 0; i < parts.length; i++) {
                nums[i] = Integer.parseInt(parts[i].trim());
            }
            System.out.println(new Solution().lengthOfLIS(nums));
        }
    }
`,
    cpp: `
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
using namespace std;
int main() {
    string line;
    if (getline(cin, line)) {
        if (line.front() == '[') line = line.substr(1);
        if (line.back() == ']') line = line.substr(0, line.length() - 1);
        stringstream ss(line);
        string token;
        vector<int> nums;
        while (getline(ss, token, ',')) {
            nums.push_back(stoi(token));
        }
        cout << Solution().lengthOfLIS(nums) << endl;
    }
    return 0;
}
`,
    c: `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    char line[1000];
    if (fgets(line, sizeof(line), stdin)) {
        char* start = strchr(line, '[');
        char* end = strchr(line, ']');
        if (start && end) {
            *end = '\\0';
            start++;
            int nums[1000];
            int size = 0;
            char* token = strtok(start, ",");
            while (token) {
                nums[size++] = atoi(token);
                token = strtok(NULL, ",");
            }
            printf("%d\\n", lengthOfLIS(nums, size));
        }
    }
    return 0;
}
`
  },
  "Coin Change": {
    python: `
import sys, json
if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if len(lines) >= 2:
        coins = json.loads(lines[0])
        amount = int(lines[1])
        print(coinChange(coins, amount))
`,
    javascript: `
const fs = require('fs');
const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (lines.length >= 2) {
    console.log(coinChange(JSON.parse(lines[0]), parseInt(lines[1])));
}
`,
    java: `
    public static void main(String[] args) throws Exception {
        java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String line1 = br.readLine();
        String line2 = br.readLine();
        if (line1 != null && line2 != null) {
            line1 = line1.trim();
            if (line1.startsWith("[")) line1 = line1.substring(1);
            if (line1.endsWith("]")) line1 = line1.substring(0, line1.length() - 1);
            String[] parts = line1.split(",");
            int[] coins = new int[parts.length];
            for (int i = 0; i < parts.length; i++) {
                coins[i] = Integer.parseInt(parts[i].trim());
            }
            int amount = Integer.parseInt(line2.trim());
            System.out.println(new Solution().coinChange(coins, amount));
        }
    }
`,
    cpp: `
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
using namespace std;
int main() {
    string line1, line2;
    if (getline(cin, line1) && getline(cin, line2)) {
        if (line1.front() == '[') line1 = line1.substr(1);
        if (line1.back() == ']') line1 = line1.substr(0, line1.length() - 1);
        stringstream ss(line1);
        string token;
        vector<int> coins;
        while (getline(ss, token, ',')) {
            coins.push_back(stoi(token));
        }
        int amount = stoi(line2);
        cout << Solution().coinChange(coins, amount) << endl;
    }
    return 0;
}
`,
    c: `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    char line1[1000], line2[100];
    if (fgets(line1, sizeof(line1), stdin) && fgets(line2, sizeof(line2), stdin)) {
        char* start = strchr(line1, '[');
        char* end = strchr(line1, ']');
        if (start && end) {
            *end = '\\0';
            start++;
            int coins[1000];
            int size = 0;
            char* token = strtok(start, ",");
            while (token) {
                coins[size++] = atoi(token);
                token = strtok(NULL, ",");
            }
            int amount = atoi(line2);
            printf("%d\\n", coinChange(coins, size, amount));
        }
    }
    return 0;
}
`
  }
};

export function injectDriver(code: string, problemTitle: string, languageId: string): string {
  const config = DRIVER_MAP[problemTitle];
  if (!config) return code;
  
  if (languageId === 'python' && config.python) {
    return code + "\n" + config.python;
  }
  
  if (languageId === 'javascript' && config.javascript) {
    return code + "\n" + config.javascript;
  }
  
  if (languageId === 'java' && config.java) {
    // Java needs main inside class Solution
    const lastBraceIdx = code.lastIndexOf('}');
    if (lastBraceIdx !== -1) {
      return code.substring(0, lastBraceIdx) + "\n" + config.java + "\n}";
    }
  }
  
  if (languageId === 'cpp' && config.cpp) {
    return code + "\n" + config.cpp;
  }
  
  if (languageId === 'c' && config.c) {
    return code + "\n" + config.c;
  }
  
  return code;
}
