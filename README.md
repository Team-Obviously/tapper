# Tapp3d 🚀

**NFC + ZK + cloud + clever hacks = effortless, secure, privacy-first event networking.**

We're redefining how people connect at events by making NFC-powered interactions effortless and natural. Forget awkward introductions or extra effort, our platform instantly surfaces people worth meeting the moment you arrive.

With Zero-Knowledge at the core, every interaction stays fully private until both parties choose to engage. No unwanted visibility, no forced sharing, just secure, authentic connections on your terms.

By seamlessly blending digital discovery with real-world encounters, we're making meaningful connections feel as simple and natural as saying hello.

## ✨ Features

### 🎯 **Smart Event Networking**

- **NFC-Powered Connections**: Simply tap NFC tags to instantly connect with people
- **Interest-Based Matching**: AI algorithms surface people with shared interests
- **Real-time Discovery**: Find relevant connections the moment you arrive at events

### 🔒 **Privacy-First Architecture**

- **Zero-Knowledge Proofs**: All interactions remain private until both parties consent
- **Selective Sharing**: Choose exactly what information to reveal and when
- **No Forced Visibility**: Your data stays secure until you decide to connect

### 🌐 **Decentralized Identity**

- **ENS Integration**: Create and manage your identity using Ethereum Name Service
- **Blockchain-Verified Profiles**: Authentic, tamper-proof professional identities
- **Cross-Platform Compatibility**: Your identity works across the entire Web3 ecosystem

### 📄 **Document Verification**

- **ZK-PDF Proofs**: Verify credentials and documents without revealing sensitive data
- **Mopro Integration**: Generate cryptographic proofs for professional qualifications

### ☁️ **Distributed Storage**

- **Walrus Storage**: Decentralized storage for all generated artifacts and proofs
- **IPFS Integration**: Immutable, distributed file storage
- **Redundant Backups**: Your data is always safe and accessible

## 🛠️ Technology Stack

### **Frontend**

- **React 18** with TypeScript
- **Tailwind CSS** for mobile-first design
- **Vite** for fast development
- **React Router** for navigation
- **Shadcn/ui** for beautiful components

### **Backend**

- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** with Drizzle ORM
- **RESTful APIs** for all operations

### **Blockchain & Privacy**

- **ENS (Ethereum Name Service)** for decentralized identity
- **ZK-PDF** for private document verification
- **Mopro** for zero-knowledge proof generation
- **Walrus** for decentralized artifact storage

### **Hardware Integration**

- **NFC Technology** for seamless physical interactions
- **Real-time Scanning** and connection establishment

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- NFC-enabled device for testing

## 📱 How It Works

### 1. **Create Your Profile**

- Sign up with email or connect your ENS domain
- Add your interests, skills, and professional background
- Upload verified documents using ZK-PDF proofs

### 2. **Attend Events**

- Arrive at any supported event or venue
- Your profile automatically discovers relevant connections nearby
- Get notified about people worth meeting based on shared interests

### 3. **Connect Seamlessly**

- Tap NFC tags or scan QR codes to initiate connections
- Both parties see compatibility scores and shared interests
- Choose to connect only when mutual interest exists

### 4. **Build Your Network**

- Accept connection invitations from interesting people
- Message directly through integrated Telegram
- View detailed profiles of your professional network

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │    Database     │
│   React + TS    │◄──►│  Node.js + TS    │◄──►│   PostgreSQL    │
│   Tailwind CSS  │    │   Express API    │    │   Drizzle ORM   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web3 Layer    │    │   Privacy Layer  │    │  Storage Layer  │
│   ENS + Wallet  │    │   ZK Proofs      │    │   Walrus IPFS   │
│   Smart Contracts│   │   Mopro + zkPDF  │    │   Artifacts     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 API Endpoints

### **User Management**

- `POST /api/users/login` - Email-based authentication
- `POST /api/users/create-user` - User registration
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update user profile

### **NFC & Connections**

- `POST /api/nfc/scan` - Process NFC tag scans
- `GET /api/nfc/user/:userId` - Get user's NFC tags
- `POST /api/connections/create` - Establish new connection

### **Interest Matching**

- `GET /api/similarity/interest-connections/:userId` - Get interest-based matches
- `POST /api/similarity/calculate` - Calculate compatibility scores

### **Invitations & Networking**

- `POST /api/invitations/send` - Send connection invitation
- `GET /api/invitations/received/:userId` - Get pending invitations
- `POST /api/invitations/respond` - Accept/reject invitations

## 🔐 Privacy & Security

- **Zero-Knowledge Architecture**: No personal data is exposed without explicit consent
- **End-to-End Encryption**: All communications are encrypted
- **Decentralized Storage**: No single point of failure for your data
- **Blockchain Verification**: All identities and credentials are cryptographically verified
- **Selective Disclosure**: You control exactly what information to share

## 🌟 Use Cases

### **Professional Events**

- Tech conferences and meetups
- Industry networking events
- Job fairs and recruitment

### **Social Gatherings**

- University events and alumni meetups
- Sports clubs and hobby groups
- Community gatherings

### **Business Networking**

- Trade shows and exhibitions
- Corporate events and seminars
- Startup pitch events

## 🙏 Acknowledgments

- **ENS Team** for decentralized identity infrastructure
- **ZK-PDF** for privacy-preserving document verification
- **Mopro** for zero-knowledge proof generation
- **Walrus** for decentralized storage solutions
- **Ethereum Foundation** for blockchain infrastructure

**Made with ❤️ by the Tapp3d Team**

_Connecting people, preserving privacy, building the future of networking._
