## Purpose

ProductQuarry helps founders collect and track customer feedback on their newly launched products.

## How does it work

Founders create a board for their product. They can have multiple boards, with the number determined by pricing tiers. The free tier allows founders to create one board with unlimited feedback. 

Founders can make their board public so everyone can see feedback about their product. Public viewers can also vote on feedback.

The founder adds a script to their product that posts in-app feedback to a webhook, which then adds it to the board.   

This script would be an embeddable widget.  The widget will be an embeddable form that can be added to a page or a modal. 

Initially, there will be three types of feedback that can be given: 

- Report A Bug
- Suggest an Improvement
- Send Feedback

Founders can view customer feedback and categorize it using custom categories and tags. If the board is public, they can add a reply that everyone will see. Alternatively, they can send a private message to the individual via email (for now).

Founders can also delete feedback if they think it's unhelpful. 

Each board has settings that determine whether posts are immediately visible or require founder approval.

If the board is public, there should be an option for users to add a feedback

## In the Future

We will use AI to create insights about the feedback we are receiving about the product.  The AI will rank feedback as being positive or negative, and prioritize recurring issues and themes.

If the board is public, there should be an option for users to add a feedback. 

We will also allow users to have conversations on the public feedback board.  

## UI Requirements

- Clean and minimalist design
- Responsive layout that works on desktop and mobile
- Suggest color palette and typography that fits my app's purpose

## Technical Requirements (TechStack)

- Nextjs (latest)
- Tanstack Query (use query and mutation hooks)
- React Hook Form
- Supabase
- ShadCn
- Motion  (animation)
- Biome (for linting)

## Non Functional Requirements

- Must be responsive
- Must be multi-tenanted