# cPanel Angular - Client Management System

A modern client management control panel built with Angular 17, Tailwind CSS, and Lucide icons. This project recreates the original vanilla JavaScript cPanel with a modern Angular architecture.

## 🚀 Features

- **Modern Angular 17** - Latest Angular with standalone components
- **Tailwind CSS** - Utility-first CSS framework with custom theme
- **Lucide Icons** - Beautiful, customizable icons
- **Dark/Light Mode** - Theme switching with system preference detection
- **Responsive Design** - Mobile-first responsive layout
- **Real-time Data** - Reactive data management with RxJS
- **Type Safety** - Full TypeScript support with interfaces

## 📋 Components

### Core Components
- **Dashboard** - Overview with statistics and recent clients
- **Clients** - Client management with filtering, sorting, and pagination
- **Birthdays** - Upcoming birthday tracking
- **Statistics** - Analytics and performance metrics

### Services
- **ClientService** - Client data management and filtering
- **ThemeService** - Dark/light mode management

### Models
- **Client** - Client data interface
- **Transaction** - Transaction data interface
- **Product** - Product data interface

## 🛠️ Tech Stack

- **Framework**: Angular 17
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide Angular
- **State Management**: RxJS BehaviorSubject
- **Routing**: Angular Router
- **Build Tool**: Angular CLI

## 🎨 Design Features

- **Glass Morphism** - Modern backdrop blur effects
- **Gradient Cards** - Beautiful gradient backgrounds
- **Smooth Animations** - Hover effects and transitions
- **Custom Brand Colors** - Tailored color palette
- **Responsive Grid** - Adaptive layouts for all screen sizes

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cpanel-angular
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── birthdays/
│   │   └── statistics/
│   ├── models/
│   │   ├── client.model.ts
│   │   ├── transaction.model.ts
│   │   └── product.model.ts
│   ├── services/
│   │   ├── client.service.ts
│   │   └── theme.service.ts
│   ├── app.component.ts
│   ├── app.component.html
│   ├── app.routes.ts
│   └── app.config.ts
├── styles.css
└── main.ts
```

## 🎯 Key Features

### Dashboard
- Total clients overview
- Active/Inactive client counts
- Upcoming birthdays (30 days)
- Recent clients list
- Activity feed

### Client Management
- Search by name
- Filter by birthday month
- Filter by status (Active/Inactive)
- Sort by name or birthday
- Pagination support
- CRUD operations

### Birthday Tracking
- Upcoming birthdays (30 days)
- Age calculation
- Days until birthday
- Color-coded urgency levels

### Statistics
- Total revenue calculation
- Average revenue per client
- Monthly revenue breakdown
- Performance metrics
- Client retention rates

## 🎨 Customization

### Theme Colors
The project uses a custom brand color palette defined in `tailwind.config.js`:

```javascript
colors: {
  brand: {
    50: '#eef7ff',
    100: '#d9edff',
    200: '#bfe0ff',
    300: '#93ccff',
    400: '#5db1ff',
    500: '#3a93ff',
    600: '#2c75e6',
    700: '#245ec0',
    800: '#1f4f9e',
    900: '#1d447f'
  }
}
```

### Dark Mode
The application supports automatic dark mode detection and manual toggle. Theme preference is stored in localStorage.

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔧 Development

### Adding New Components
1. Create component in `src/app/components/`
2. Add route in `app.routes.ts`
3. Import in parent component if needed

### Adding New Services
1. Create service in `src/app/services/`
2. Use `@Injectable({ providedIn: 'root' })`
3. Inject where needed

### Styling Guidelines
- Use Tailwind utility classes
- Follow the established color scheme
- Maintain consistent spacing (gap-6, p-6, etc.)
- Use glass morphism effects for overlays

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Serve Production Build
```bash
npm run preview
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support or questions, please open an issue in the repository.

---

Built with ❤️ using Angular 17, Tailwind CSS, and Lucide icons.
