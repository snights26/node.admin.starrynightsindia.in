import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import Pagination, { usePagination } from "../../Common/Pagination";
import BackButton from "../../Common/BackButton";
import "./ChatbotAnalytics.css";

function ChatbotAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/chatbot/analytics")
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, []);

  const escalationRate = analytics?.escalationRate
    ? `${Math.round(analytics.escalationRate * 100)}%`
    : "0%";
  const intents = analytics?.intentBreakdown || [];
  const questions = analytics?.topQuestions || [];
  const filteredIntents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? intents.filter((item) => String(item.intent || "").toLowerCase().includes(query)) : intents;
  }, [intents, search]);
  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? questions.filter((item) => String(item.question || "").toLowerCase().includes(query)) : questions;
  }, [questions, search]);
  const intentPagination = usePagination(filteredIntents, 5, search);
  const questionPagination = usePagination(filteredQuestions, 5, search);

  return (
    <div className="chat-analytics-page">
      <div className="chat-analytics-header">
        <div>
          <h1>Chat Analytics</h1>
          <p>Monitor chatbot usage, unanswered volume, and intent patterns.</p>
        </div>
        <BackButton />
      </div>

      {loading ? (
        <div className="chat-analytics-empty">Loading analytics...</div>
      ) : !analytics ? (
        <div className="chat-analytics-empty">Analytics could not be loaded.</div>
      ) : (
        <>
          <div className="chat-analytics-stats">
            <div>
              <span>Total Queries</span>
              <strong>{analytics.totalQueries || 0}</strong>
            </div>
            <div>
              <span>Escalations</span>
              <strong>{analytics.escalationCount || 0}</strong>
            </div>
            <div>
              <span>Escalation Rate</span>
              <strong>{escalationRate}</strong>
            </div>
          </div>

          <input
            className="chat-analytics-search"
            type="search"
            placeholder="Search intents and top questions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="chat-analytics-grid">
            <section>
              <h2>Intent Breakdown</h2>
              {filteredIntents.length === 0 ? (
                <p className="chat-analytics-muted">No intent data yet.</p>
              ) : (
                <div className="chat-analytics-list">
                  {intentPagination.pageItems.map((item) => (
                    <div key={item.intent}>
                      <span>{item.intent}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              )}
              <Pagination {...intentPagination} itemCount={filteredIntents.length} label="intents" />
            </section>

            <section>
              <h2>Top Questions</h2>
              {filteredQuestions.length === 0 ? (
                <p className="chat-analytics-muted">No repeated questions yet.</p>
              ) : (
                <div className="chat-analytics-list questions">
                  {questionPagination.pageItems.map((item) => (
                    <div key={item.question}>
                      <span>{item.question}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              )}
              <Pagination {...questionPagination} itemCount={filteredQuestions.length} label="questions" />
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatbotAnalytics;
