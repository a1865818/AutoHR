from langchain_community.tools import TavilySearchResults

# Initialize Tavily
tavily = TavilySearchResults(api_key='tvly-000000000000000000000000000000000000000000000000')

# Function to search using Tavily
def search_with_tavily(query):
    results = tavily.search(query)
    return results

# Example usage
if __name__ == "__main__":
    query = "What is the capital of France?"
    results = search_with_tavily(query)
    print(results)