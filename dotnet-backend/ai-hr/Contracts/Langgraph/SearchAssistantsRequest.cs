namespace ai_hr.Contracts.Langgraph;

public class SearchAssistantsRequest
{
    public object? Metadata { get; set; }
    public string? GraphId { get; set; }
    public int? Limit { get; set; }
    public int? Offset { get; set; }
    public string? SortBy { get; set; }
    public string? SortOrder { get; set; }
}