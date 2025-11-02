# Code Review Agent Examples

This document provides example scenarios demonstrating the capabilities of the comprehensive code review agent.

## Example 1: Security Vulnerability Detection

### Code with Issues (Vulnerable to SQL Injection)

```typescript
// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { userId, query } = await request.json();
  
  // Vulnerable to SQL injection
  const result = await db.query(
    `SELECT * FROM users WHERE id = ${userId} AND name LIKE '%${query}%'`
  );
  
  return NextResponse.json(result);
}
```

### Expected Agent Feedback

**🔴 Critical Issues**

**Location**: `app/api/user/route.ts:7-9`
**Problem**: SQL Injection vulnerability - User input is directly concatenated into SQL query without sanitization
**Solution**:
```typescript
const result = await db.query(
  'SELECT * FROM users WHERE id = $1 AND name LIKE $2',
  [userId, `%${query}%`]
);
```
**Rationale**: Parameterized queries prevent SQL injection by separating SQL code from data.

---

## Example 2: Performance Optimization

### Code with Issues (N+1 Query Problem)

```typescript
// src/components/UserList.tsx
export function UserList({ users }: { users: User[] }) {
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          <Image 
            src={user.avatar} 
            alt={user.name}
            width={100}
            height={100}
          />
          <span>{fetchUserDetails(user.id).bio}</span>
        </div>
      ))}
    </div>
  );
}
```

### Expected Agent Feedback

**🔴 Critical Issues**

**Location**: `src/components/UserList.tsx:8`
**Problem**: N+1 Query Problem - `fetchUserDetails` is called in a loop, causing one database query per user
**Solution**: Fetch all user details in a single query before rendering
```typescript
export async function UserList({ users }: { users: User[] }) {
  const userIds = users.map(u => u.id);
  const details = await fetchUserDetailsBatch(userIds);
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          <Image 
            src={user.avatar} 
            alt={user.name}
            width={100}
            height={100}
            loading="lazy"
          />
          <span>{details[user.id]?.bio}</span>
        </div>
      ))}
    </div>
  );
}
```
**Rationale**: Batch queries and lazy loading images improve performance significantly.

**🟡 Suggestions**

**Location**: `src/components/UserList.tsx:5-8`
**Problem**: Images are loaded eagerly, impacting initial page load
**Solution**: Add `loading="lazy"` to images (shown above)
**Rationale**: Lazy loading defers image loading until they're near the viewport.

---

## Example 3: Code Quality Improvements

### Code with Issues (Intentionally Poor Code for Demonstration)

```typescript
// src/lib/utils.ts
export function processData(data: any) {
  if (data && data.items) {
    let result = [];
    for (let i = 0; i < data.items.length; i++) {
      if (data.items[i].status === 1) {
        result.push({
          id: data.items[i].id,
          name: data.items[i].name,
          value: data.items[i].value * 1.2
        });
      }
    }
    return result;
  }
  return [];
}
```

### Expected Agent Feedback

**🟡 Suggestions**

**Location**: `src/lib/utils.ts:1`
**Problem**: Using `any` type removes TypeScript type safety
**Solution**:
```typescript
interface DataItem {
  id: string;
  name: string;
  value: number;
  status: number;
}

interface InputData {
  items: DataItem[];
}

interface ProcessedItem {
  id: string;
  name: string;
  value: number;
}

export function processData(data: InputData | null): ProcessedItem[] {
  if (!data?.items) return [];
  
  const ACTIVE_STATUS = 1;
  const MARKUP_RATE = 1.2;
  
  return data.items
    .filter(item => item.status === ACTIVE_STATUS)
    .map(item => ({
      id: item.id,
      name: item.name,
      value: item.value * MARKUP_RATE
    }));
}
```
**Rationale**: 
- Type safety catches errors at compile time
- Named constants improve readability
- Functional approach is more concise and maintainable

---

## Example 4: Architecture & Design Patterns

### Code with Issues (Demonstrates Common Anti-Patterns)

```typescript
// app/admin/users/page.tsx
'use client';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);
  
  // Direct database access in client component
  const supabase = createClient();
  const { data: roles } = await supabase.from('roles').select('*');
  
  return <div>{/* render */}</div>;
}
```

### Expected Agent Feedback

**🔴 Critical Issues**

**Location**: `app/admin/users/page.tsx:16-17`
**Problem**: Cannot use `await` outside async function, and direct database queries in client components expose credentials
**Solution**: Use Server Components for data fetching
```typescript
// app/admin/users/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { UsersList } from './UsersList';

export default async function UsersPage() {
  const supabase = createServerClient();
  
  const [{ data: users }, { data: roles }] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('roles').select('*')
  ]);
  
  return <UsersList users={users} roles={roles} />;
}
```
**Rationale**: Server Components keep credentials secure and improve performance.

**🟡 Suggestions**

**Location**: `app/admin/users/page.tsx:4-11`
**Problem**: Manual fetch with useState/useEffect instead of using TanStack Query
**Solution**: Use TanStack Query for data fetching in client components if needed
```typescript
import { useQuery } from '@tanstack/react-query';

function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });
}
```
**Rationale**: TanStack Query provides caching, revalidation, and better error handling.

**✅ Good Practices**

- Using TypeScript for type safety
- Proper error handling with try-catch
- Loading states for better UX

---

## Example 5: Testing & Documentation

### Code with Issues (Missing Types and Documentation)

```typescript
// src/lib/calculateDiscount.ts
export function calc(price, type, code) {
  if (type === 'vip') {
    if (code === 'SPECIAL') {
      return price * 0.5;
    }
    return price * 0.8;
  }
  return price * 0.9;
}
```

### Expected Agent Feedback

**🟡 Suggestions**

**Location**: `src/lib/calculateDiscount.ts:1-10`
**Problem**: Missing types, unclear function name, no documentation, no tests
**Solution**:
```typescript
// src/lib/calculateDiscount.ts
/**
 * Calculates the discounted price based on user type and discount code
 * @param price - Original price in cents
 * @param userType - User membership type ('vip' | 'regular')
 * @param discountCode - Optional promotional code
 * @returns Discounted price in cents
 * @example
 * calculateDiscountedPrice(10000, 'vip', 'SPECIAL') // Returns 5000 (50% off)
 */
export function calculateDiscountedPrice(
  price: number,
  userType: 'vip' | 'regular',
  discountCode?: string
): number {
  const VIP_SPECIAL_DISCOUNT = 0.5;
  const VIP_DISCOUNT = 0.8;
  const REGULAR_DISCOUNT = 0.9;
  
  if (userType === 'vip') {
    return discountCode === 'SPECIAL' 
      ? price * VIP_SPECIAL_DISCOUNT
      : price * VIP_DISCOUNT;
  }
  
  return price * REGULAR_DISCOUNT;
}
```

```typescript
// tests/unit/calculateDiscount.test.ts
import { describe, it, expect } from 'vitest';
import { calculateDiscountedPrice } from '@/lib/calculateDiscount';

describe('calculateDiscountedPrice', () => {
  it('applies 50% discount for VIP with SPECIAL code', () => {
    expect(calculateDiscountedPrice(10000, 'vip', 'SPECIAL')).toBe(5000);
  });
  
  it('applies 20% discount for VIP without code', () => {
    expect(calculateDiscountedPrice(10000, 'vip')).toBe(8000);
  });
  
  it('applies 10% discount for regular users', () => {
    expect(calculateDiscountedPrice(10000, 'regular')).toBe(9000);
  });
  
  it('handles zero price', () => {
    expect(calculateDiscountedPrice(0, 'vip')).toBe(0);
  });
});
```
**Rationale**: 
- Clear naming improves code understanding
- JSDoc provides IDE hints and documentation
- Types prevent runtime errors
- Tests ensure correctness and prevent regressions

---

## Using the Agent

To invoke the code review agent on specific code:

1. Select the code you want reviewed
2. Type: `@copilot /code-review`
3. Optional: Add focus area: `@copilot /code-review security`

The agent will analyze the code and provide structured feedback following the format demonstrated above.
