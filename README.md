# Inreach
An AI tool that writes and sends custom email pitches for faster, smarter outreach

## How It Works

1a. Enter an excel sheet or csv list containing contact info and list of emails or other personal contact details
1b. Enter a list of websites or links that the user would want scrapped and use those contacts scrapped to send emails or messages ❌
2. Enter a prompt explaining what the business does and what It wants to accomplish from the email marketing
3. Select marketing copies that the user likes and resonates with
4. Using MailJet API to start sending emails to the contacts and keep track of any emails that were failed to be sent

## Content Upload

1. Add a data input for excel spreadsheets or csv files
2. Using regex guess to auto-guess the columns with the contacts
3. Showcase first 5 rows to user for column confirmation

## Main Pain Points Solved

1. Repetitive Email Marketing takes too much time, the automated email sending solves this pain point for agency owners and businesses
2. Building a successful email marketing copy can cost agency owners, the pitch builder solves this pain point for solopreneurs
3. Agency owners and solopreneurs pay bloated prices for CRMs and Email Marketing tools with features they don't need

### Creating custom GPTs → Knowledge Embedding

1. Collect mock or knowledge data about certain topic  
   - [ ] Collect and clean email/podcast copy data  
   - [ ] Remove irrelevant or repetitive segments  
   - [ ] Standardize formats for consistency  

2. Vectorise the data to make it easier for model to comprehend user requests and data entries  
   - [ ] Break large documents into smaller, meaningful chunks (~500 tokens)  
   - [ ] Maintain contextual flow across chunks  
   - [ ] Vectorize data with embeddings using OpenAI or a local model  

3. Perform similarity search on the user entered data  
   - [ ] Build a similarity search function  
   - [ ] Retrieve the most relevant vector chunks based on user query  

4. Setup LLMChain & prompts for handling the data response  
   - [ ] Setup LLMChain or RetrievalQA using LangChain  
   - [ ] Feed prompt + retrieved context into the chain  
   - [ ] Generate accurate, high-quality outputs  

5. Retrieval argument generation  
   - [ ] Tune system prompts and outputs  
   - [ ] Adjust temperature, output length, and response format for marketing-quality copy  
   - [ ] Iteratively test and refine  
