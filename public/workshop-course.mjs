// A taught sequence, separate from the topic reference library.
import {firstSteps} from './firststeps.mjs';
const read=(title,paragraphs,code='',notes=[])=>({kind:'read',title,paragraphs,code,notes});
const predict=(title,code,question,options,answer,feedback)=>({kind:'predict',title,code,question,options,answer,feedback});
const trace=(title,code,frames)=>({kind:'trace',title,code,frames});
const lab=(title,paragraphs)=>({kind:'lab',title,paragraphs});
const test=(label,args,expected)=>({label,args,expected});
export const workshopChapters=[
 {
  id:'variables',title:'Read and change Java code',concept:'Variables · statements · assignment',outcome:'Represent the copper press’s inventory and change it without losing track of the values.',minutes:25,
  steps:[
   read('Start with the machine we are building',[
    'Our project is a copper press. It consumes copper ingots and produces plates. Eventually it needs a block, an inventory, a recipe, saved progress, and multiplayer behavior. We start with the Java that decides what happens to the inventory. You can run and test that logic before connecting it to Minecraft.',
    'You know a little Python, so we will connect familiar ideas to Java syntax. We will explain a piece of code, follow its execution, ask you to predict a result, and then have you change it. The final exercise asks you to combine the ideas without showing the answer.',
    'The example below is a complete Java class. A class groups related code. The braces after CopperPressLogic surround the class. The next pair surrounds a method: a named operation. For now, leave the method header in place; we will unpack it in chapter 4. Inside it, statements run from top to bottom. return sends a value back to the code that called the method.'
   ],'public class CopperPressLogic {\n    static int remainingIngots() {\n        int ingots = 12;\n        ingots = ingots - 3;\n        return ingots;\n    }\n}',[
    ['public class CopperPressLogic','The outer container. In a project this public class goes in CopperPressLogic.java.'],
    ['static int remainingIngots()','A named calculation. The app calls it for you. int before its name says it returns a whole number.'],
    ['{ ... }','Braces group code. Indentation makes the grouping readable; unlike Python, indentation does not define the block.'],
    [';','A semicolon ends a statement such as a variable declaration, assignment, or return. Do not put one after an opening class or method brace.']
   ]),
   read('Declare a value, then use its name',[
    'In Python you might write ingots = 12. Java writes int ingots = 12; when introducing that variable. Read it as: create a variable named ingots, restricted to whole numbers, with initial value 12. int is its type; ingots is its name; 12 is its initial value.',
    'Once a local variable has been declared, use its name without repeating the type. ingots = ingots - 3; first reads the old value, subtracts three, then stores the result back. It is an update, not a mathematical equation. Writing int ingots again in the same block would try to declare a second variable with the same name.',
    'Names are case-sensitive: ingots and Ingots are different. Use names that tell you the role of a value. Statements inside this method can use ingots; a different method cannot automatically see this local variable. That region of visibility is called its scope.'
   ],'int ingots = 12;\nint used = 3;\ningots = ingots - used;\nreturn ingots;',[
    ['int','Use int for the bounded whole-number counts in these exercises. It cannot hold a fractional plate.'],
    ['=','Evaluate the right side, then assign that result to the variable on the left.'],
    ['ingots - used','An expression: code that produces a value. Here it produces 9.']
   ]),
   trace('Follow the inventory values','int ingots = 12;\nint used = 3;\ningots = ingots - used;\nreturn ingots;',[
    {line:0,values:{},explanation:'Nothing has run yet. Click Next statement to execute the first declaration.'},
    {line:1,values:{ingots:12},explanation:'The declaration creates ingots with value 12.'},
    {line:2,values:{ingots:12,used:3},explanation:'used is a separate variable. Declaring it does not change ingots.'},
    {line:3,values:{ingots:9,used:3},explanation:'The right side reads 12 and 3. The subtraction produces 9, which replaces ingots. used stays 3.'},
    {line:4,values:{ingots:9,used:3,returned:9},explanation:'return reads ingots and gives 9 to the caller. The method ends here.'}
   ]),
   predict('Check your mental model','int ingots = 12;\nint used = 3;\ningots = ingots - used;\nused = 5;\nreturn ingots;','What value is returned?',['7','9','12'],1,[
    'That would be 12 - 5. But ingots was updated before used became 5. Assignment stores the result at that moment; it does not store a live formula.',
    'Yes. The subtraction stored 9. Changing used later does not rerun earlier statements.',
    'The third statement reassigns ingots. It is no longer 12 when return reads it.'
   ]),
   read('Three value types you will use constantly',[
    'A press needs counts, ratios, and decisions. int holds whole numbers; double holds floating-point numbers such as 0.75; boolean holds true or false. Java also has String for text, written in double quotes. These declarations are not interchangeable: boolean running = 1; does not compile.',
    'For your first exercise, edit the code inside the method below. The app already supplies the surrounding class and the code that calls your method. Do not paste a second outer class into the editor. Do not remove the header or the final return. The point is to write the inventory calculation yourself, then see whether it behaves as specified.',
    'A compiler error means Java could not turn your source into a runnable program. A failed test means the source compiled, but returned the wrong result for a particular input. These are different problems; the feedback panel will tell you which happened.'
   ],'int ingots = 12;\ndouble fill = 0.75;\nboolean running = true;\nString machineName = "Copper Press";'),
   lab('Your turn: account for two operations',[
    'A press starts with 18 ingots. One operation consumes 4, and the next consumes 6. Declare the count, update it for each operation, and return the remaining count. Use the same assignment pattern you just traced.',
    'After the tests pass, explain to yourself why changing a cost variable later would not undo an earlier subtraction. Then continue to calculations with varying inputs.'
   ])
  ],
  exercise:{method:'remainingIngots',task:'Write the three inventory statements inside the provided method. It must return 8 after consuming 4 and then 6 from 18.',starter:'static int remainingIngots() {\n    // Declare ingots with the starting count.\n    // Subtract the first cost, then the second cost.\n    return ingots;\n}',solution:'static int remainingIngots() {\n    int ingots = 18;\n    ingots = ingots - 4;\n    ingots = ingots - 6;\n    return ingots;\n}',hints:['A declaration starts with the type: int ingots = ...;','An update does not repeat int: ingots = ingots - ...;','Write the two updates in order. The intermediate counts should be 14 and 8.'],tests:[test('Both operations consume their inputs',[],8)]}
 },
 {
  id:'recipes',title:'Calculate recipe batches',concept:'Expressions · division · remainders',outcome:'Calculate full batches and leftovers from an inventory count.',minutes:30,
  steps:[
   read('Turn a recipe rule into an expression',[
    'Our recipe consumes three copper ingots for each batch. A batch produces two plates. With eight ingots, the press can finish two batches. Two ingots remain. Before coding, separate these three quantities: ingots available, batches possible, and plates produced. Mixing their units is a common source of bugs.',
    'Java uses +, -, *, and / for arithmetic. Multiplication and division happen before addition and subtraction. Parentheses make the order explicit: (ingots / 3) * 2 calculates full batches first, then converts batches to plates.',
    'Both ingots and 3 are integers. Integer division discards the fractional part, so 8 / 3 produces 2. For full batches, that is exactly what we need. We are using nonnegative counts here; invalid input will be addressed in the validation chapter.'
   ],'int ingots = 8;\nint batches = ingots / 3;\nint plates = batches * 2;\nint leftover = ingots % 3;',[
    ['ingots / 3','How many complete groups of three fit? 8 / 3 gives 2.'],
    ['batches * 2','Convert batches into output plates: 2 × 2 = 4.'],
    ['ingots % 3','The remainder after dividing: 8 % 3 gives 2. The % operator is remainder, not percentage.']
   ]),
   trace('Trace a batch calculation','int ingots = 8;\nint batches = ingots / 3;\nint plates = batches * 2;\nint leftover = ingots % 3;',[
    {line:0,values:{},explanation:'We are calculating what could be processed. No Minecraft inventory is being mutated.'},
    {line:1,values:{ingots:8},explanation:'There are eight input ingots.'},
    {line:2,values:{ingots:8,batches:2},explanation:'Two complete groups of three fit into eight. The fractional part is discarded.'},
    {line:3,values:{ingots:8,batches:2,plates:4},explanation:'Two batches times two plates per batch yields four plates.'},
    {line:4,values:{ingots:8,batches:2,plates:4,leftover:2},explanation:'8 = 2 × 3 + 2. Six ingots would be consumed and two would remain.'}
   ]),
   predict('Choose the correct order','int ingots = 8;\nint plates = (ingots / 3) * 2;','Why divide before multiplying?',['Because 8 * 2 / 3 also always produces full batches','Because only complete groups of three can produce plates','Because Java requires parentheses around all division'],1,[
    '8 * 2 / 3 gives 5, not 4. That invents a plate from an incomplete batch. Calculate complete batches first.',
    'Exactly. Two complete batches each produce two plates. An incomplete batch produces nothing.',
    'Parentheses are optional when precedence already gives the intended order. Here they communicate the grouping; full batches are the reason for that grouping.'
   ]),
   read('A progress fraction needs a different kind of division',[
    'A progress bar asks a different question: what fraction is complete? Three ticks out of four should be 0.75. int division would give zero. A double on the left side does not fix a division that already happened as integers.',
    '(double) progress converts that operand to a floating-point value before division. Java then performs floating-point division with duration as well. This explicit conversion is called a cast. Use it when you need a ratio, not when you want full batches.',
    'A denominator of zero is invalid for this progress calculation. Later we will return early for invalid durations. For now, notice how the same operator is appropriate in different ways depending on the question and the operand types.'
   ],'int progress = 3;\nint duration = 4;\ndouble wrong = progress / duration;\ndouble fraction = (double) progress / duration;',[
    ['wrong','Stores 0.0: integer division happened first, then the result was converted.'],
    ['fraction','Stores 0.75: conversion happened before division.']
   ]),
   predict('Apply the ratio rule','int progress = 7;\nint duration = 10;\ndouble fraction = (double) progress / duration;','What is stored in fraction?',['0.0','0.7','7.0'],1,[
    'That would happen without the cast. The cast changes the division to floating-point arithmetic.',
    'Yes. 7 becomes 7.0 before division, so the result is 0.7.',
    'The cast changes the numeric type; division still divides by ten.'
   ]),
   lab('Your turn: produce only complete batches',[
    'The method receives an ingots count. That name is already declared in its header, so use it directly. All inputs in this exercise are nonnegative. Calculate the number of full three-ingot batches, then return two plates for each batch.',
    'Try 2, 3, and 8 by hand first. These cases distinguish no batch, exactly one batch, and an incomplete final batch. The tests check those boundaries as well as empty and full stacks.'
   ])
  ],
  exercise:{method:'platesFrom',task:'Return two plates for each full batch of three ingots. Do not consume a partial batch. Inputs are nonnegative.',starter:'static int platesFrom(int ingots) {\n    // Calculate full batches, then the number of plates.\n    return 0;\n}',solution:'static int platesFrom(int ingots) {\n    int batches = ingots / 3;\n    return batches * 2;\n}',hints:['Use integer division because partial batches cannot run.','First declare int batches = ingots / 3;','The return expression converts batches to plates by multiplying by 2.'],tests:[test('Empty input',[0],0),test('Incomplete batch',[2],0),test('Exactly one batch',[3],2),test('Leftover ingots',[8],4),test('Full stack',[64],42)]}
 },
 {
  id:'decisions',title:'Decide when the press can run',concept:'Comparisons · boolean logic · guards',outcome:'Reject invalid operations before a machine changes its inventory.',minutes:30,
  steps:[
   read('Describe one decision precisely',[
    'A processing tick must answer whether it may run. Our rule is: there are at least three ingots, at least two empty output spaces, and the machine is enabled. Write the rule in words before choosing Java operators. Each part produces true or false.',
    '>= means greater than or equal to. > excludes equality. If exactly three ingots are enough, ingots > 3 is a bug because it rejects the exact cost. <= and < work the same way in the other direction. == compares two values; = assigns a value.',
    '&& combines conditions with AND: both must be true. || means OR: at least one must be true. ! negates a boolean. Java evaluates && left to right and stops at the first false part because the whole result is already known.'
   ],'boolean enoughInput = ingots >= 3;\nboolean outputFits = freeOutput >= 2;\nboolean canRun = enabled && enoughInput && outputFits;',[
    ['ingots >= 3','The exact boundary passes: 3 >= 3 is true.'],
    ['enabled && enoughInput && outputFits','Every requirement must hold. Using || would allow one requirement to stand in for the others.'],
    ['!enabled','True when enabled is false. Useful for an early rejection.']
   ]),
   predict('Check the boundary','int ingots = 3;\nint freeOutput = 2;\nboolean enabled = true;\nreturn enabled && ingots >= 3 && freeOutput >= 2;','Does this press run?',['Yes: every requirement is met exactly','No: it needs more than three ingots','No: the output must have more than two spaces'],0,[
    'Yes. >= includes equality, so both minimum requirements pass.',
    'That would be the behavior of > 3. The rule and the code use >= 3.',
    'Two spaces are sufficient for two plates. >= 2 includes that exact boundary.'
   ]),
   read('Use if to choose which code executes',[
    'An if statement evaluates a boolean expression inside parentheses. If it is true, Java executes the following block. If it is false, Java skips that block and continues afterward. Braces make the block boundaries clear.',
    'A guard clause puts a rejection at the beginning. return false; immediately leaves the method. A later return true; is reached only when every earlier rejection was skipped. This is useful when you want each failure condition to have a clear place.',
    'This method only decides. It does not subtract ingots or produce plates. Keeping a decision separate from mutation prevents a failed operation from consuming inputs before discovering that the output is full.'
   ],'if (!enabled) {\n    return false;\n}\nif (ingots < 3) {\n    return false;\n}\nif (freeOutput < 2) {\n    return false;\n}\nreturn true;',[
    ['if (!enabled)','Enter this block when the machine is disabled.'],
    ['return false;','End the entire method now, not just the if block.'],
    ['return true;','Reached only after all three rejection checks have been skipped.']
   ]),
   trace('Follow an output-full rejection','if (!enabled) return false;\nif (ingots < 3) return false;\nif (freeOutput < 2) return false;\nreturn true;',[
    {line:0,values:{enabled:true,ingots:9,freeOutput:1},explanation:'The caller supplies these values. Our decision begins with enough input but insufficient output room.'},
    {line:1,values:{enabled:true,ingots:9,freeOutput:1},explanation:'!true is false. Skip the return on this line.'},
    {line:2,values:{enabled:true,ingots:9,freeOutput:1},explanation:'9 < 3 is false. Skip this return too.'},
    {line:3,values:{enabled:true,ingots:9,freeOutput:1,returned:false},explanation:'1 < 2 is true. Return false now. The last line never executes.'}
   ]),
   predict('Spot a permission bug','return enabled || ingots >= 3 || freeOutput >= 2;','What can go wrong with this version?',['It rejects every enabled machine','It can allow an enabled machine to run with no input','It only accepts machines with all three requirements'],1,[
    'An enabled machine makes the first condition true. With OR, that is sufficient to accept it.',
    'Correct. A true enabled value is enough for the entire OR expression, even when input and output checks would fail.',
    'That is AND behavior. OR accepts when any one requirement is true.'
   ]),
   lab('Your turn: enforce all three requirements',[
    'Write canRun so that it returns true only when the machine is enabled, has at least three ingots, and has room for at least two plates. Use one && expression or a sequence of early returns.',
    'The header declares all three inputs. Read their order carefully: ingots, freeOutput, enabled. An exact boundary should pass. Disabling the machine must override otherwise sufficient resources.'
   ])
  ],
  exercise:{method:'canRun',task:'Accept only enabled presses with ingots >= 3 and freeOutput >= 2.',starter:'static boolean canRun(int ingots, int freeOutput, boolean enabled) {\n    // Express all three requirements.\n    return false;\n}',solution:'static boolean canRun(int ingots, int freeOutput, boolean enabled) {\n    return enabled && ingots >= 3 && freeOutput >= 2;\n}',hints:['Each comparison produces a boolean, so they can be joined with &&.','Use >= rather than > so the exact resource cost passes.','Alternatively, return false for each failed condition, then return true at the end.'],tests:[test('Exact requirements',[3,2,true],true),test('Missing input',[2,2,true],false),test('Output blocked',[9,1,true],false),test('Disabled',[9,6,false],false),test('More than enough',[12,8,true],true),test('Empty but enabled',[0,0,true],false)]}
 },
 {
  id:'methods',title:'Write a reusable processing method',concept:'Parameters · arguments · return values',outcome:'Build a method that works for different machines and recipe costs.',minutes:30,
  steps:[
   read('Unpack the method header',[
    'You have been editing inside provided method headers. Now we can read every part. A method is a named operation that a caller can invoke. Its header declares the result type, the method name, and the inputs. The body between braces implements the operation.',
    'In static int afterBatch(int ingots, int cost), the first int promises an integer result. afterBatch is the name. The two int declarations inside parentheses are parameters: local names that receive the caller’s values. static means the caller does not need to create a CopperPressLogic object to use this calculation. We will use objects for independent machine state in chapter 6.',
    'return ingots - cost; calculates a result and hands it to the caller. return does not print it, save it to disk, or automatically change the caller’s inventory. Those are separate actions.'
   ],'static int afterBatch(int ingots, int cost) {\n    return ingots - cost;\n}\n\n// Inside the calling method:\nint remaining = afterBatch(12, 3);',[
    ['int afterBatch','The method returns a whole number. A boolean method must return true or false instead.'],
    ['int ingots, int cost','Parameter types and names. A comma separates the two inputs.'],
    ['afterBatch(12, 3)','The arguments are 12 and 3. They bind to parameters in that order.'],
    ['int remaining = ...','The caller chooses to store the returned value. Here remaining becomes 9.']
   ]),
   trace('Follow a call into and out of a method','int inventory = 12;\nint remaining = afterBatch(inventory, 3);\n// In afterBatch: return ingots - cost;\ninventory = remaining;',[
    {line:0,values:{},explanation:'We start in the caller, not in afterBatch.'},
    {line:1,values:{inventory:12},explanation:'The caller has a local variable inventory.'},
    {line:2,values:{inventory:12,'parameter ingots':12,'parameter cost':3},explanation:'Calling afterBatch copies the integer argument values into its parameters.'},
    {line:3,values:{inventory:12,remaining:9},explanation:'afterBatch returns 9. Its call expression produces 9, which is assigned to remaining. inventory still contains 12.'},
    {line:4,values:{inventory:9,remaining:9},explanation:'The caller explicitly replaces inventory with remaining. This assignment changes the caller’s value.'}
   ]),
   predict('Separate calculation from mutation','int inventory = 12;\nafterBatch(inventory, 3);\nreturn inventory;','What does the caller return?',['9','12','3'],1,[
    'afterBatch calculates 9, but the caller did not store its result. Passing an int does not let the method replace the caller’s variable.',
    'Correct. The returned value is ignored. To change inventory, write inventory = afterBatch(inventory, 3);',
    '3 is the second argument, the cost. It is not assigned to inventory.'
   ]),
   read('Specify invalid inputs before implementing',[
    'A reusable method needs rules for more than the ordinary case. We will define remainingAfter(ingots, cost) as follows: subtract cost when it is positive and affordable; otherwise return ingots unchanged. The caller promises ingots is nonnegative. A cost of zero or less is rejected.',
    'With this contract, test cases follow directly: 12 and 3 give 9; 3 and 3 give 0; 2 and 3 give 2; 12 and -3 give 12. The negative-cost guard matters because subtracting a negative would increase the inventory.',
    'Every normal path through an int-returning method must return an int. A compiler message saying missing return statement means at least one path can fall off the end. Returning from only one if block is not sufficient.'
   ],'static int remainingAfter(int ingots, int cost) {\n    if (cost <= 0) {\n        return ingots;\n    }\n    // Check affordability here.\n    // Then return the new count.\n}'),
   predict('Predict the rejection result','remainingAfter(2, 3)','According to our contract, what should happen?',['Return -1 because 2 - 3 is -1','Return 0 by clamping the count','Return 2 because the batch is unaffordable'],2,[
    'The arithmetic is correct, but the contract rejects an unaffordable operation before subtracting.',
    'Clamping after subtraction would silently consume two ingots for a batch that could not finish.',
    'Correct. Rejection preserves the original inventory count.'
   ]),
   lab('Your turn: implement the whole contract',[
    'Replace the starter’s placeholder with your own guard clauses and return expression. You now have enough information to write the method body from its contract.',
    'Read failed cases as evidence. If an exact-cost case fails, inspect > versus >=. If negative cost increases the result, reject it before subtraction. Avoid returning one fixed answer: this method must work across inputs.'
   ])
  ],
  exercise:{method:'remainingAfter',task:'Return ingots unchanged when cost <= 0 or cost > ingots. Otherwise return ingots - cost. ingots is nonnegative.',starter:'static int remainingAfter(int ingots, int cost) {\n    return ingots;\n}',solution:'static int remainingAfter(int ingots, int cost) {\n    if (cost <= 0) return ingots;\n    if (cost > ingots) return ingots;\n    return ingots - cost;\n}',hints:['Reject bad costs before doing subtraction.','The unaffordable condition is cost > ingots. Equality should be accepted.','After both guards, return ingots - cost; every path now has a result.'],tests:[test('Ordinary batch',[12,3],9),test('Exact cost',[3,3],0),test('Unaffordable',[2,3],2),test('Zero cost rejected',[12,0],12),test('Negative cost rejected',[12,-3],12),test('Empty inventory',[0,3],0)]}
 },
 {
  id:'loops',title:'Inspect every inventory slot',concept:'Arrays · indices · loops · accumulation',outcome:'Count full recipe batches across multiple slots without merging their leftovers.',minutes:35,
  steps:[
   read('Store a sequence of counts',[
    'An inventory contains several slots. For this logic exercise, represent each slot by its ingot count. int[] means an array of integers. An array has a fixed length and stores values at numbered positions called indices. The first index is zero.',
    'For counts = {4, 2, 7}, counts[0] is 4, counts[1] is 2, and counts[2] is 7. counts.length is 3. There is no counts[3]: length is the number of elements, not the last valid index. Accessing it throws ArrayIndexOutOfBoundsException.',
    'A real Minecraft inventory contains item stacks with identity and components as well as counts. This array deliberately isolates the counting algorithm so you can understand and test it before adding item matching.'
   ],'int[] counts = {4, 2, 7};\nint firstCount = counts[0];\nint numberOfSlots = counts.length;',[
    ['int[]','An array whose elements are int values.'],
    ['counts[0]','Read the first slot’s count. Square brackets select an element.'],
    ['counts.length','The number of elements. Unlike a method call, this has no parentheses.']
   ]),
   read('Repeat an operation with a for loop',[
    'A for loop has three parts separated by semicolons. int slot = 0 runs once to initialize an index. slot < counts.length is checked before each iteration. slot++ runs after the body and adds one to the index. When the condition becomes false, execution continues after the loop.',
    'The body below adds the number of full batches available in one slot. += is shorthand: total += batches means total = total + batches. Declare total before the loop so it survives across iterations. If you reset it inside the loop, earlier slots’ contributions are lost.',
    'Our chosen rule processes each slot independently. Leftover ingots in different slots are not combined. This is a contract for this exercise, not a claim that every Minecraft recipe works that way.'
   ],'int total = 0;\nfor (int slot = 0; slot < counts.length; slot++) {\n    int batches = counts[slot] / 3;\n    total += batches;\n}\nreturn total;',[
    ['slot < counts.length','Only indices 0 through length - 1 enter the body.'],
    ['slot++','Increase slot by one after the body finishes.'],
    ['total += batches','Accumulate the current slot’s contribution.']
   ]),
   trace('Trace three slots','int total = 0;\nfor (int slot = 0; slot < counts.length; slot++) {\n    int batches = counts[slot] / 3;\n    total += batches;\n}\nreturn total;',[
    {line:0,values:{counts:'[4, 2, 7]'},explanation:'Each slot is processed independently using a three-ingot batch.'},
    {line:1,values:{total:0},explanation:'Initialize the accumulator once.'},
    {line:4,values:{slot:0,count:4,batches:1,total:1},explanation:'First iteration: 4 / 3 = 1. Add one to total.'},
    {line:4,values:{slot:1,count:2,batches:0,total:1},explanation:'Second iteration: 2 / 3 = 0. total stays one.'},
    {line:4,values:{slot:2,count:7,batches:2,total:3},explanation:'Third iteration: 7 / 3 = 2. total becomes three.'},
    {line:6,values:{slot:3,total:3,returned:3},explanation:'3 < 3 is false. The loop ends before accessing counts[3], and the method returns three.'}
   ]),
   predict('Reason about separate slots','int[] counts = {2, 2};','How many full batches can this per-slot rule make?',['0','1','2'],0,[
    'Correct. Neither slot contains three ingots. Combining the two counts would implement a different contract.',
    'Adding the counts first would give one batch. Our contract explicitly keeps each slot separate.',
    'Two ingots are insufficient for even one three-ingot batch in either slot.'
   ]),
   read('Use a simpler loop when you do not need the index',[
    'An enhanced for loop visits each value directly: for (int count : counts). Read the colon as “in”. The loop creates count for the current element, runs the body, then moves to the next element. It avoids writing an index when you only need values.',
    'For an empty array, either form executes the body zero times. A total initialized to zero is therefore the correct result. Thinking about the zero-iteration case often reveals whether the accumulator is placed correctly.',
    'You may use either loop style in the exercise. Use the form whose execution you can explain. Do not replace the per-slot division with a final division of the combined total; that changes how leftovers are handled.'
   ],'int total = 0;\nfor (int count : counts) {\n    total += count / 3;\n}\nreturn total;'),
   lab('Your turn: sum per-slot batches',[
    'Write totalBatches for a non-null array of nonnegative slot counts. Each group of three within the same slot contributes one batch. Return the sum of those batch counts.',
    'The empty-array and [2, 2] cases matter. They catch incorrect starting values and accidental merging of leftovers. If Java reports an index exception, trace the final condition of your loop.'
   ])
  ],
  exercise:{method:'totalBatches',task:'Sum count / 3 for each slot independently. counts is non-null and contains nonnegative integers.',starter:'static int totalBatches(int[] counts) {\n    // Initialize an accumulator.\n    // Visit each slot and add its full batches.\n    return 0;\n}',solution:'static int totalBatches(int[] counts) {\n    int total = 0;\n    for (int count : counts) {\n        total += count / 3;\n    }\n    return total;\n}',hints:['Declare total before the loop, starting at zero.','for (int count : counts) visits the counts without an index.','Inside the loop, add count / 3 to total. Return total after the loop ends.'],tests:[test('No slots',[[]],0),test('Separate leftovers',[[2,2]],0),test('Mixed slots',[[4,2,7]],3),test('Exact batches',[[3,6,9]],6),test('One stack',[[64]],21),test('Empty slots',[[0,0,0]],0)]}
 },
 {
  id:'objects',title:'Give every press its own state',concept:'Classes · objects · fields · constructors',outcome:'Create independent storage objects and prevent one press from changing another.',minutes:35,
  steps:[
   read('Move from a calculation to an object',[
    'So far our methods receive values and return results. A placed press must also remember its inventory between calls. An object groups state with operations on that state. A class defines what that kind of object contains; new constructs an individual instance.',
    'The Press class below declares a field named ingots. Each Press object receives its own copy of that field. Press(int initialIngots) is its constructor: it runs when new Press(...) creates an object. A constructor has the class’s name and no return type.',
    'private means code outside Press cannot directly read or assign the ingots field. The remaining method provides controlled access. This keeps ownership clear: callers ask the object for information or request an operation.'
   ],'static class Press {\n    private int ingots;\n\n    Press(int initialIngots) {\n        ingots = initialIngots;\n    }\n\n    int remaining() {\n        return ingots;\n    }\n}',[
    ['static class Press','For this lab, Press is a nested class inside the app’s test container. static here lets it be constructed without an outer container instance.'],
    ['private int ingots','An instance field. Unlike a local variable, it belongs to the object and remains between method calls.'],
    ['Press(int initialIngots)','Construct one object with an initial count.'],
    ['int remaining()','An instance method: it reads ingots from the particular Press it is called on.']
   ]),
   read('Call an operation on one particular instance',[
    'Press first = new Press(12); creates a Press object and stores a reference to it in first. A reference lets you access that object; it is not a second copy of all its fields. first.consume(3) calls consume on that object.',
    'A second new Press(8) creates a separate object. Changing first’s ingots does not change second’s ingots. But Press alias = first; gives another name referring to the same object. An operation through alias affects the object also referenced by first.',
    'Inside an instance method, this refers to the current object. this.ingots explicitly names its field. A common constructor style uses this.ingots = ingots; where the right-hand ingots is the parameter and this.ingots is the field.'
   ],'Press first = new Press(12);\nPress second = new Press(8);\nfirst.consume(3);\n\n// first.remaining() is now 9.\n// second.remaining() is still 8.'),
   predict('Distinguish objects from references','Press first = new Press(12);\nPress alias = first;\nalias.consume(3);','What does first.remaining() return after a valid consume?',['12, because alias has copied all the fields','9, because both references point to the same object','3, because consume replaces the field with its argument'],1,[
    'Assigning an object reference does not clone the object. Only one Press was constructed here.',
    'Correct. There is one object with two references. The consume operation changes that object’s ingots to 9.',
    'Our consume operation subtracts the cost from the field; it does not replace the count with the cost.'
   ]),
   read('Keep shared definitions separate from placed machines',[
    'A static field belongs to the class rather than each instance. If ingots were static, all Press objects would access the same field. Constructing a second press could overwrite the first press’s inventory. Leave per-machine state on the instance.',
    'This matters when you reach Fabric: a registered block object is a shared definition of a block type. It is not a separate object for every placement. Per-position mutable state, such as a press inventory, normally belongs to a block entity. The reference library has the lifecycle and persistence topics for that next step.',
    'The exercise supplies the class and the test entry point. Implement consume inside Press. It should change this object only when cost is positive and affordable, and report success as a boolean. This combines the guards, assignments, and methods from earlier chapters.'
   ],'boolean consume(int cost) {\n    if (cost <= 0) return false;\n    if (cost > ingots) return false;\n    ingots = ingots - cost;\n    return true;\n}',[
    ['return false','Rejected operations preserve the field.'],
    ['ingots = ingots - cost','Updates this instance’s field.'],
    ['return true','Reports success after the mutation has happened.']
   ]),
   predict('Reason about a rejected request','Press first = new Press(2);\nboolean accepted = first.consume(3);','Which pair of results matches the contract?',['accepted is false; remaining is 2','accepted is false; remaining is 0','accepted is true; remaining is -1'],0,[
    'Yes. Reject before mutation so an unaffordable operation leaves the inventory intact.',
    'This would report failure after consuming available items. Rejection must not mutate the field.',
    'This accepts an unaffordable request and breaks the nonnegative-count rule.'
   ]),
   lab('Your turn: preserve independent state',[
    'Replace the placeholder inside consume. Keep the supplied class and remainingAfterTwo method: the latter creates two presses, attempts a consume on one, and checks that the other is untouched.',
    'After this chapter, download the Java source and read it outside the app. You have practiced the language needed to understand a basic machine’s logic. Connecting it to a running Fabric mod still requires the game-specific registration, resource, block-entity, and persistence steps in the library.'
   ])
  ],
  exercise:{method:'remainingAfterTwo',task:'Implement Press.consume: reject nonpositive or unaffordable cost without changing ingots; otherwise subtract cost and return true.',starter:'static class Press {\n    private int ingots;\n    Press(int initialIngots) { ingots = initialIngots; }\n    int remaining() { return ingots; }\n    boolean consume(int cost) {\n        // Implement the operation here.\n        return false;\n    }\n}\n\nstatic int remainingAfterTwo(int initial, int cost) {\n    Press first = new Press(initial);\n    Press other = new Press(8);\n    boolean accepted = first.consume(cost);\n    boolean shouldAccept = cost > 0 && cost <= initial;\n    if (accepted != shouldAccept) return -999;\n    if (other.remaining() != 8) return -888;\n    return first.remaining();\n}',solution:'static class Press {\n    private int ingots;\n    Press(int initialIngots) { ingots = initialIngots; }\n    int remaining() { return ingots; }\n    boolean consume(int cost) {\n        if (cost <= 0 || cost > ingots) return false;\n        ingots = ingots - cost;\n        return true;\n    }\n}\nstatic int remainingAfterTwo(int initial, int cost) {\n    Press first = new Press(initial);\n    Press other = new Press(8);\n    boolean accepted = first.consume(cost);\n    boolean shouldAccept = cost > 0 && cost <= initial;\n    if (accepted != shouldAccept) return -999;\n    if (other.remaining() != 8) return -888;\n    return first.remaining();\n}',hints:['All changes belong inside consume. ingots is already a field; do not declare a local replacement.','Use early returns for cost <= 0 or cost > ingots.','Subtract cost from the field, then return true. -999 from the harness means the success flag was wrong; -888 means the second press changed.'],tests:[test('One object consumes',[12,3],9),test('Exact cost',[3,3],0),test('Rejected input',[2,3],2),test('Zero cost',[12,0],12),test('Negative cost',[12,-3],12),test('Independent empty press',[0,1],0)]}
 }
];

workshopChapters.unshift(firstSteps);

export function workshopComplete(chapter,row={}) {
 return Boolean((chapter.exercise?row.codePassed:row.activityPassed) && chapter.steps.every((s,i)=>s.kind!=='predict'||row.checks?.[i]));
}
export function exportedSource(chapter,code) {
 const args=chapter.exercise.tests[0].args.map(v=>Array.isArray(v)?`new int[]{${v.join(', ')}}`:String(v)).join(', ');
 return `// The Biome of Minecraft Modding — ${chapter.title}\n// Compile: javac CopperPressLogic.java\n// Run: java CopperPressLogic\npublic class CopperPressLogic {\n${code.split('\n').map(l=>'    '+l).join('\n')}\n    public static void main(String[] args) {\n        System.out.println(${chapter.exercise.method}(${args}));\n    }\n}\n`;
}
