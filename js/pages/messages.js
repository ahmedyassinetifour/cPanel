import { mount } from "../app.js";

function read(k, fb) {
  try {
    const s = localStorage.getItem(k);
    return s ? JSON.parse(s) : fb;
  } catch (e) {
    return fb;
  }
}

function write(k, v) {
  localStorage.setItem(k, JSON.stringify(v));
}

function getMessages() {
  return read("cpanel.messages", []);
}

function saveMessages(messages) {
  write("cpanel.messages", messages);
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSubject(subject) {
  const subjects = {
    general: "General Inquiry",
    "custom-order": "Custom Order Request",
    support: "Support",
    feedback: "Feedback",
    partnership: "Partnership",
    other: "Other",
  };
  return subjects[subject] || subject;
}

function getStatusColor(status) {
  return status === "unread"
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
}

function renderMessageCard(message, index) {
  return `
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow duration-200">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="font-semibold text-slate-900 dark:text-slate-100 text-lg">
              ${message.firstName} ${message.lastName}
            </h3>
            <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
              message.status
            )}">
              ${message.status}
            </span>
          </div>
          <div class="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              ${message.email}
            </span>
            ${
              message.phone
                ? `
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                ${message.phone}
              </span>
            `
                : ""
            }
          </div>
          <div class="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
            <span class="font-medium">${formatSubject(message.subject)}</span>
            <span>${formatDate(message.date)}</span>
            ${
              message.newsletter
                ? '<span class="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">Newsletter</span>'
                : ""
            }
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="toggleMessageStatus(${index})" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" title="${
    message.status === "unread" ? "Mark as read" : "Mark as unread"
  }">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
                message.status === "unread"
                  ? "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  : "M8 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              }"/>
            </svg>
          </button>
          <button onclick="deleteMessage(${index})" class="p-2 text-red-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete message">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
        <p class="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">${
          message.message
        }</p>
      </div>
    </div>
  `;
}

export function renderMessages(container) {
  document.getElementById("page-title").textContent = "Messages";

  const messages = getMessages();
  const unreadCount = messages.filter((m) => m.status === "unread").length;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Contact Messages</h1>
          <p class="text-slate-600 dark:text-slate-400 mt-1">
            ${messages.length} total messages${
    unreadCount > 0 ? `, ${unreadCount} unread` : ""
  }
          </p>
        </div>
        <div class="flex gap-3">
          <button onclick="filterMessages('all')" id="filter-all" class="px-4 py-2 rounded-lg font-medium transition-colors bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100">
            All (${messages.length})
          </button>
          <button onclick="filterMessages('unread')" id="filter-unread" class="px-4 py-2 rounded-lg font-medium transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            Unread (${unreadCount})
          </button>
          <button onclick="filterMessages('read')" id="filter-read" class="px-4 py-2 rounded-lg font-medium transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            Read (${messages.length - unreadCount})
          </button>
        </div>
      </div>

      <div id="messages-container" class="space-y-4">
        ${
          messages.length === 0
            ? `
          <div class="text-center py-12">
            <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No messages yet</h3>
            <p class="text-slate-500 dark:text-slate-400">When customers contact you through the website, their messages will appear here.</p>
          </div>
        `
            : messages
                .map((message, index) => renderMessageCard(message, index))
                .join("")
        }
      </div>
    </div>
  `;

  // Attach global functions to window for onclick handlers
  window.toggleMessageStatus = function (index) {
    const messages = getMessages();
    if (messages[index]) {
      messages[index].status =
        messages[index].status === "unread" ? "read" : "unread";
      saveMessages(messages);
      mount(() => renderMessages(container));
    }
  };

  window.deleteMessage = function (index) {
    if (confirm("Are you sure you want to delete this message?")) {
      const messages = getMessages();
      messages.splice(index, 1);
      saveMessages(messages);
      mount(() => renderMessages(container));
    }
  };

  window.filterMessages = function (filter) {
    const messages = getMessages();
    let filteredMessages = messages;

    if (filter === "unread") {
      filteredMessages = messages.filter((m) => m.status === "unread");
    } else if (filter === "read") {
      filteredMessages = messages.filter((m) => m.status === "read");
    }

    // Update filter buttons
    document.querySelectorAll('[id^="filter-"]').forEach((btn) => {
      btn.className =
        "px-4 py-2 rounded-lg font-medium transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100";
    });
    document.getElementById(`filter-${filter}`).className =
      "px-4 py-2 rounded-lg font-medium transition-colors bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100";

    // Update messages container
    const container = document.getElementById("messages-container");
    if (filteredMessages.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No ${filter} messages</h3>
          <p class="text-slate-500 dark:text-slate-400">No messages match the selected filter.</p>
        </div>
      `;
    } else {
      container.innerHTML = filteredMessages
        .map((message, originalIndex) => {
          // Find original index for proper function calls
          const realIndex = messages.findIndex((m) => m.id === message.id);
          return renderMessageCard(message, realIndex);
        })
        .join("");
    }
  };
}
